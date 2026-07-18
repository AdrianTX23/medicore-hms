import "server-only";
import { prisma } from "@/lib/prisma";
import type { Paginated } from "@/shared/utils/table-params";

export type BedTile = {
  id: string;
  code: string;
  status: "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE";
  admission: {
    id: string;
    patient: { id: string; firstName: string; lastName: string; mrn: string };
    admittedAt: Date;
  } | null;
};

export type DepartmentWard = {
  id: string;
  name: string;
  beds: BedTile[];
};

/** Full ward map: every department, its beds, and who's in each occupied one. */
export async function getBedMap(): Promise<DepartmentWard[]> {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      rooms: {
        orderBy: { number: "asc" },
        select: {
          beds: {
            orderBy: { code: "asc" },
            select: {
              id: true,
              code: true,
              status: true,
              admissions: {
                where: { status: "ADMITTED" },
                take: 1,
                select: {
                  id: true,
                  admittedAt: true,
                  patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  return departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    beds: dept.rooms.flatMap((room) =>
      room.beds.map((bed) => ({
        id: bed.id,
        code: bed.code,
        status: bed.status,
        admission: bed.admissions[0]
          ? {
              id: bed.admissions[0].id,
              patient: bed.admissions[0].patient,
              admittedAt: bed.admissions[0].admittedAt,
            }
          : null,
      })),
    ),
  }));
}

export type AvailableBed = {
  id: string;
  code: string;
  departmentName: string;
  roomNumber: string;
};

export async function getAvailableBeds(): Promise<AvailableBed[]> {
  const beds = await prisma.bed.findMany({
    where: { status: "AVAILABLE" },
    orderBy: [{ room: { department: { name: "asc" } } }, { code: "asc" }],
    select: {
      id: true,
      code: true,
      room: {
        select: { number: true, department: { select: { name: true } } },
      },
    },
  });

  return beds.map((b) => ({
    id: b.id,
    code: b.code,
    departmentName: b.room.department.name,
    roomNumber: b.room.number,
  }));
}

export type AdmissionListItem = {
  id: string;
  admittedAt: Date;
  admissionDiagnosis: string;
  patient: { id: string; firstName: string; lastName: string; mrn: string };
  bed: { code: string; room: { number: string; department: { name: string } } };
  attendingDoctor: { firstName: string; lastName: string };
};

export async function listActiveAdmissions(params: {
  skip: number;
  take: number;
}): Promise<Paginated<AdmissionListItem>> {
  const where = { status: "ADMITTED" as const };

  const [rows, total] = await prisma.$transaction([
    prisma.admission.findMany({
      where,
      orderBy: { admittedAt: "desc" },
      skip: params.skip,
      take: params.take,
      select: {
        id: true,
        admittedAt: true,
        admissionDiagnosis: true,
        patient: { select: { id: true, firstName: true, lastName: true, mrn: true } },
        bed: { select: { code: true, room: { select: { number: true, department: { select: { name: true } } } } } },
        attendingDoctor: { select: { firstName: true, lastName: true } },
      },
    }),
    prisma.admission.count({ where }),
  ]);

  return {
    rows,
    total,
    page: Math.floor(params.skip / params.take) + 1,
    perPage: params.take,
    pageCount: Math.max(Math.ceil(total / params.take), 1),
  };
}

export type AdmissionDetail = NonNullable<Awaited<ReturnType<typeof getAdmissionDetail>>>;

export async function getAdmissionDetail(id: string) {
  const admission = await prisma.admission.findUnique({
    where: { id },
    include: {
      patient: {
        select: { id: true, firstName: true, lastName: true, mrn: true, birthDate: true, bloodType: true, allergies: true },
      },
      bed: { select: { id: true, code: true, room: { select: { number: true, department: { select: { name: true } } } } } },
      attendingDoctor: { select: { firstName: true, lastName: true, specialty: { select: { name: true } } } },
      transfers: {
        orderBy: { transferredAt: "desc" },
        include: {
          fromBed: { select: { code: true } },
          toBed: { select: { code: true } },
        },
      },
    },
  });
  if (!admission) return null;

  return {
    ...admission,
    patient: {
      ...admission.patient,
      allergies: (admission.patient.allergies as string[] | null) ?? [],
    },
  };
}
