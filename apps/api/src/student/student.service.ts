import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  ClassEnrollmentStatusEnum,
  PaymentStatusEnum,
  SemesterEnum,
  StudentStatusEnum,
} from '@repo/contracts';
import { Student } from './entity/student.entity.js';
import { StudentClass } from './entity/student-class.entity.js';
import { Class } from './entity/class.entity.js';
import { StudentPaymentService } from './student-payment.service.js';
import type {
  CreateStudentDto,
  UpdateStudentDto,
} from './dto/create-student.dto.js';
import type { FindStudentsDto } from './dto/find-students.dto.js';
import type {
  AssignStudentClassesDto,
  PromoteStudentDto,
  BatchPromoteStudentsDto,
} from './dto/class.dto.js';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(StudentClass)
    private readonly studentClassRepo: Repository<StudentClass>,

    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,

    private readonly paymentService: StudentPaymentService,
  ) {}

  async findAll(dto: FindStudentsDto) {
    const {
      search,
      classId,
      status,
      gender,
      includeDeleted,
      onlyDeleted,
      sortBy = 'id',
      sortOrder = 'DESC',
    } = dto;

    const query = this.studentRepo
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.enrollments', 'enrollment')
      .leftJoinAndSelect('enrollment.class', 'class')
      .leftJoinAndSelect('student.payments', 'payment');

    if (onlyDeleted) {
      query.withDeleted().andWhere('student.deleted_at IS NOT NULL');
    } else if (includeDeleted) {
      query.withDeleted();
    }

    if (status) {
      query.andWhere('student.status = :status', { status });
    }

    if (gender) {
      query.andWhere('student.gender = :gender', { gender });
    }

    if (classId) {
      query.andWhere('enrollment.class_id = :classId AND enrollment.status = :enrollmentStatus', {
        classId,
        enrollmentStatus: ClassEnrollmentStatusEnum.ENROLLED,
      });
    }

    if (search) {
      query.andWhere(
        '(student.first_name LIKE :search OR student.last_name LIKE :search OR student.first_name_km LIKE :search OR student.last_name_km LIKE :search OR student.student_code LIKE :search OR student.contact LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const currentYear = dto.billingYear || new Date().getFullYear();
    const currentMonth = dto.billingMonth || (new Date().getMonth() + 1);

    if (dto.paymentStatus) {
      if (dto.paymentStatus === PaymentStatusEnum.PAID) {
        query.andWhere(
          `EXISTS (
            SELECT 1 FROM student_payments sp
            WHERE sp.student_id = student.id
              AND sp.billing_year = :payYear
              AND sp.billing_month = :payMonth
              AND sp.status = 'PAID'
          )`,
          { payYear: currentYear, payMonth: currentMonth },
        );
      } else if (dto.paymentStatus === PaymentStatusEnum.PARTIAL) {
        query.andWhere(
          `EXISTS (
            SELECT 1 FROM student_payments sp
            WHERE sp.student_id = student.id
              AND sp.status = 'PARTIAL'
          )`,
        );
      } else if (dto.paymentStatus === PaymentStatusEnum.UNPAID) {
        query.andWhere(
          `(
            NOT EXISTS (
              SELECT 1 FROM student_payments sp
              WHERE sp.student_id = student.id
                AND sp.billing_year = :payYear
                AND sp.billing_month = :payMonth
                AND sp.status IN ('PAID', 'PARTIAL')
            )
            OR EXISTS (
              SELECT 1 FROM student_payments sp
              WHERE sp.student_id = student.id
                AND sp.billing_year = :payYear
                AND sp.billing_month = :payMonth
                AND sp.status = 'UNPAID'
            )
          )`,
          { payYear: currentYear, payMonth: currentMonth },
        );
      } else if (dto.paymentStatus === PaymentStatusEnum.OVERDUE) {
        const todayDay = new Date().getDate();
        query.andWhere(
          `(
            (
              student.payable_date < :todayDay AND NOT EXISTS (
                SELECT 1 FROM student_payments sp
                WHERE sp.student_id = student.id
                  AND sp.billing_year = :payYear
                  AND sp.billing_month = :payMonth
                  AND sp.status = 'PAID'
              )
            )
            OR EXISTS (
              SELECT 1 FROM student_payments sp
              WHERE sp.student_id = student.id
                AND (
                  sp.billing_year < :payYear
                  OR (sp.billing_year = :payYear AND sp.billing_month < :payMonth)
                )
                AND sp.status != 'PAID'
            )
          )`,
          { todayDay, payYear: currentYear, payMonth: currentMonth },
        );
      }
    }

    query.orderBy(`student.${sortBy}`, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);

    const [students, total] = await query.getManyAndCount();

    // Attach computed payment summaries for the retrieved page of students
    const dataWithSummaries = await Promise.all(
      students.map(async (student) => {
        const json = typeof student.toJSON === 'function' ? student.toJSON() : student;
        const summary = await this.paymentService.getStudentPaymentSummary(student);
        return {
          ...json,
          paymentSummary: summary,
        };
      }),
    );

    return [dataWithSummaries, total] as const;
  }

  async findOne(id: number) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['enrollments', 'enrollments.class', 'payments'],
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    const summary = await this.paymentService.getStudentPaymentSummary(student);
    const json = typeof student.toJSON === 'function' ? student.toJSON() : student;
    return {
      ...json,
      paymentSummary: summary,
    };
  }

  async create(dto: CreateStudentDto, _currentUserId?: number) {
    let studentCode = dto.studentCode;
    if (!studentCode) {
      const count = await this.studentRepo.count();
      studentCode = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
    }

    const student = this.studentRepo.create({
      studentCode,
      firstName: dto.firstName,
      lastName: dto.lastName,
      firstNameKm: dto.firstNameKm,
      lastNameKm: dto.lastNameKm,
      gender: dto.gender ?? 'MALE',
      dateOfBirth: dto.dateOfBirth,
      contact: dto.contact,
      guardianName: dto.guardianName,
      guardianPhone: dto.guardianPhone,
      payableDate: dto.payableDate ?? 1,
      registeredAt: dto.registeredAt ? new Date(dto.registeredAt) : new Date(),
      discount: dto.discount ?? 0,
      status: dto.status ?? StudentStatusEnum.ACTIVE,
    });

    const savedStudent = await this.studentRepo.save(student);

    if (dto.classIds && dto.classIds.length > 0) {
      const classes = await this.classRepo.findBy({ id: In(dto.classIds) });
      const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

      const enrollments = classes.map((cls, idx) => {
        const isPrimary = dto.primaryClassId ? cls.id === dto.primaryClassId : idx === 0;
        return this.studentClassRepo.create({
          studentId: savedStudent.id,
          classId: cls.id,
          academicYear: cls.academicYear || currentYear,
          semester: cls.semester || SemesterEnum.SEMESTER_1,
          isPrimary,
          status: ClassEnrollmentStatusEnum.ENROLLED,
          enrolledAt: new Date(),
        });
      });

      await this.studentClassRepo.save(enrollments);
    }

    return await this.findOne(savedStudent.id);
  }

  async update(id: number, dto: UpdateStudentDto, _currentUserId?: number) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }

    if (dto.studentCode !== undefined) student.studentCode = dto.studentCode;
    if (dto.firstName !== undefined) student.firstName = dto.firstName;
    if (dto.lastName !== undefined) student.lastName = dto.lastName;
    if (dto.firstNameKm !== undefined) student.firstNameKm = dto.firstNameKm;
    if (dto.lastNameKm !== undefined) student.lastNameKm = dto.lastNameKm;
    if (dto.gender !== undefined) student.gender = dto.gender;
    if (dto.dateOfBirth !== undefined) student.dateOfBirth = dto.dateOfBirth;
    if (dto.contact !== undefined) student.contact = dto.contact;
    if (dto.guardianName !== undefined) student.guardianName = dto.guardianName;
    if (dto.guardianPhone !== undefined) student.guardianPhone = dto.guardianPhone;
    if (dto.payableDate !== undefined) student.payableDate = dto.payableDate;
    if (dto.registeredAt !== undefined) student.registeredAt = new Date(dto.registeredAt);
    if (dto.discount !== undefined) student.discount = dto.discount;
    if (dto.status !== undefined) student.status = dto.status;

    await this.studentRepo.save(student);

    if (dto.classIds !== undefined) {
      // Remove old active enrollments
      await this.studentClassRepo.delete({
        studentId: id,
        status: ClassEnrollmentStatusEnum.ENROLLED,
      });

      if (dto.classIds.length > 0) {
        const classes = await this.classRepo.findBy({ id: In(dto.classIds) });
        const currentYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        const enrollments = classes.map((cls, idx) => {
          const isPrimary = dto.primaryClassId ? cls.id === dto.primaryClassId : idx === 0;
          return this.studentClassRepo.create({
            studentId: id,
            classId: cls.id,
            academicYear: cls.academicYear || currentYear,
            semester: cls.semester || SemesterEnum.SEMESTER_1,
            isPrimary,
            status: ClassEnrollmentStatusEnum.ENROLLED,
            enrolledAt: new Date(),
          });
        });

        await this.studentClassRepo.save(enrollments);
      }
    }

    return await this.findOne(id);
  }

  async delete(id: number) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    await this.studentRepo.softDelete(id);
    return { id, success: true };
  }

  async assignClasses(studentId: number, dto: AssignStudentClassesDto) {
    const student = await this.studentRepo.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const classes = await this.classRepo.findBy({ id: In(dto.classIds) });
    const enrollments = classes.map((cls, idx) => {
      const isPrimary = dto.primaryClassId ? cls.id === dto.primaryClassId : idx === 0;
      return this.studentClassRepo.create({
        studentId,
        classId: cls.id,
        academicYear: dto.academicYear,
        semester: dto.semester,
        isPrimary,
        status: ClassEnrollmentStatusEnum.ENROLLED,
        enrolledAt: new Date(),
      });
    });

    await this.studentClassRepo.save(enrollments);
    return await this.findOne(studentId);
  }

  async promoteStudent(dto: PromoteStudentDto) {
    const student = await this.studentRepo.findOne({ where: { id: dto.studentId } });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }

    if (dto.completePreviousEnrollment) {
      await this.studentClassRepo.update(
        {
          studentId: dto.studentId,
          classId: dto.fromClassId,
          status: ClassEnrollmentStatusEnum.ENROLLED,
        },
        {
          status: ClassEnrollmentStatusEnum.COMPLETED,
          completedAt: new Date(),
          remarks: dto.remarks ?? 'Promoted to next class',
        },
      );
    }

    const newEnrollment = this.studentClassRepo.create({
      studentId: dto.studentId,
      classId: dto.toClassId,
      academicYear: dto.academicYear,
      semester: dto.semester,
      isPrimary: true,
      status: ClassEnrollmentStatusEnum.ENROLLED,
      enrolledAt: new Date(),
      remarks: dto.remarks,
    });

    await this.studentClassRepo.save(newEnrollment);
    return await this.findOne(dto.studentId);
  }

  async batchPromoteStudents(dto: BatchPromoteStudentsDto) {
    const results = [];
    for (const studentId of dto.studentIds) {
      const res = await this.promoteStudent({
        studentId,
        fromClassId: dto.fromClassId,
        toClassId: dto.toClassId,
        academicYear: dto.academicYear,
        semester: dto.semester,
        completePreviousEnrollment: dto.completePreviousEnrollment,
        remarks: dto.remarks,
      });
      results.push(res);
    }
    return results;
  }
}
