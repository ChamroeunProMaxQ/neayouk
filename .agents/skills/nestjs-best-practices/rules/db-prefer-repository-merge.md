---
title: Prefer Repository Merge over Object.assign for Entity Updates
impact: MEDIUM-HIGH
impactDescription: Prevents relation clobbering, undefined overwrites, and type-safety issues during partial entity updates
tags: database, typeorm, repository, entity, update, nestjs
---

## Prefer Repository Merge over Object.assign for Entity Updates

**Impact: MEDIUM-HIGH (Prevents relation clobbering, undefined overwrites, and type-safety issues)**

When performing partial or full entity updates in NestJS service methods, prefer TypeORM's built-in `this.repository.merge(entity, updateDto)` over JavaScript's generic `Object.assign(entity, updateDto)`. 

### Key Principles

1. **Entity-Aware Merging**: `repository.merge()` is designed specifically for TypeORM entities. It respects entity column mappings and prevents non-column metadata from polluting the entity instance.
2. **Prevent Relation vs Foreign Key Conflicts**: When updating a foreign key column (e.g., `programId`) on an entity that previously loaded the relation (e.g., `program: { id: 1, name: 'Old' }`), clear the cached relation property (`entity.program = null`) before saving to avoid TypeORM re-binding the old relation on `save()`.
3. **Response DTO Mapping**: Always pipe the persisted entity through a dedicated DTO Mapper (`ClassMapper.toDto(saved)`) rather than returning the raw entity or relying on `toJSON()`.

**Incorrect (Using raw Object.assign without handling loaded relations or DTO mapping):**

```typescript
@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
  ) {}

  async update(id: number, dto: UpdateClassDto) {
    const cls = await this.classRepo.findOne({
      where: { id },
      relations: ['program', 'timetables'],
    });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    // ❌ Flaw 1: Raw Object.assign blindly assigns undefined or extraneous properties
    // ❌ Flaw 2: If dto.programId changes, loaded cls.program can conflict during save()
    Object.assign(cls, dto);

    // ❌ Flaw 3: Returning raw database entity directly leaks relations and decimal strings
    return await this.classRepo.save(cls);
  }
}
```

**Correct (Using repository.merge, clearing stale relations, and mapping to DTO):**

```typescript
@Injectable()
export class ClassService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
  ) {}

  async update(id: number, dto: UpdateClassDto) {
    const cls = await this.classRepo.findOne({
      where: { id },
      relations: ['enrollments', 'timetables', 'program'],
    });
    if (!cls) {
      throw new NotFoundException(`Class with ID ${id} not found`);
    }

    // Check business uniqueness constraints if code changed
    if (dto.code && dto.code !== cls.code) {
      const existing = await this.classRepo.findOne({ where: { code: dto.code } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Class with code "${dto.code}" already exists`);
      }
    }

    // Strip client-only visual helper fields
    const { program: _program, ...data } = dto;

    // If changing FK, clear cached relation object to avoid TypeORM cascade conflict
    if (data.programId !== undefined && data.programId !== cls.programId) {
      cls.program = null;
    }

    // ✅ Type-safe, entity-aware property merge
    this.classRepo.merge(cls, data);

    const saved = await this.classRepo.save(cls);

    // ✅ Map to clean @repo/contracts DTO response
    return ClassMapper.toDto(saved);
  }
}
```

Reference: [TypeORM Repository APIs](https://typeorm.io/repository-api)
