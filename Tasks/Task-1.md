# 📋 Task Assignment #1 - Healthcare API Development

**Project**: PH-HealthCare Backend  
**Module**: User Management System  
**Difficulty Level**: Beginner to Intermediate  
**Estimated Time**: 6-8 hours  
**Due Date**: [Your Instructor Will Provide]

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Tasks Overview](#tasks-overview)
5. [Detailed Task Instructions](#detailed-task-instructions)
6. [Testing Guidelines](#testing-guidelines)
7. [Submission Requirements](#submission-requirements)
8. [Grading Criteria](#grading-criteria)
9. [Common Mistakes to Avoid](#common-mistakes-to-avoid)
10. [Help & Resources](#help--resources)

---

## 🎯 Overview

### What You Will Build

You will create **complete CRUD APIs** for three user roles in our healthcare system:

- **Admin** - Manages the platform
- **Super Admin** - Has highest level access
- **Doctor** - Already created (you'll add more features)

### Learning Objectives

By completing this assignment, you will learn:

- ✅ How to create RESTful APIs following industry standards
- ✅ How to implement authentication and authorization
- ✅ How to validate request data using Zod
- ✅ How to structure code professionally
- ✅ How to implement soft delete functionality
- ✅ How to handle database transactions
- ✅ How to work with TypeScript interfaces
- ✅ How to write clean, maintainable code

---

## 📋 Prerequisites

### What You Should Already Know

Before starting this assignment, make sure you understand:

1. **TypeScript Basics**
   - Types and Interfaces
   - Async/Await
   - Promises
2. **Express.js Basics**
   - Routes and Controllers
   - Middleware
   - Request and Response objects

3. **Prisma ORM**
   - Database queries (create, findMany, findUnique, update, delete)
   - Transactions
   - Relations

4. **Zod Validation**
   - Schema creation
   - Validation rules

### What You Should Review

Look at these existing files to understand the pattern:

- `src/app/modules/user/user.controller.ts` - See `createDoctor`
- `src/app/modules/user/user.service.ts` - See `createDoctor` function
- `src/app/modules/user/user.route.ts` - See how routes are structured
- `src/app/modules/user/user.interface.ts` - See interface patterns
- `src/app/modules/user/user.validation.ts` - See Zod validation

---

## 📁 Project Structure

You will work with these modules:

```
src/app/modules/
├── user/              # User Module (Create Admin & Super Admin)
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.route.ts
│   ├── user.interface.ts
│   └── user.validation.ts
│
├── doctor/            # Doctor Module (CRUD operations)
│   ├── doctor.controller.ts
│   ├── doctor.service.ts
│   ├── doctor.route.ts
│   ├── doctor.interface.ts
│   └── doctor.validation.ts
│
├── admin/             # Admin Module (CRUD operations)
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   ├── admin.route.ts
│   ├── admin.interface.ts
│   └── admin.validation.ts
│
└── superAdmin/        # Super Admin Module (CRUD operations)
    ├── superAdmin.controller.ts
    ├── superAdmin.service.ts
    ├── superAdmin.route.ts
    ├── superAdmin.interface.ts
    └── superAdmin.validation.ts
```

---

## 📝 Tasks Overview

### Module 1: User Module (2 APIs)

- [ ] Task 1.1: Create Admin API
- [ ] Task 1.2: Create Super Admin API

### Module 2: Doctor Module (4 APIs)

- [ ] Task 2.1: Get All Doctors API
- [ ] Task 2.2: Get Doctor by ID API
- [ ] Task 2.3: Update Doctor API
- [ ] Task 2.4: Soft Delete Doctor API

### Module 3: Admin Module (4 APIs)

- [ ] Task 3.1: Get All Admins API
- [ ] Task 3.2: Get Admin by ID API
- [ ] Task 3.3: Update Admin API
- [ ] Task 3.4: Soft Delete Admin API

### Module 4: Super Admin Module (4 APIs)

- [ ] Task 4.1: Get All Super Admins API
- [ ] Task 4.2: Get Super Admin by ID API
- [ ] Task 4.3: Update Super Admin API
- [ ] Task 4.4: Soft Delete Super Admin API

**Total**: 14 APIs to implement

---

## 🎓 Detailed Task Instructions

---

## 📦 MODULE 1: USER MODULE

### Task 1.1: Create Admin API

**Endpoint**: `POST /api/users/create-admin`  
**Access**: Only SUPER_ADMIN can create admins  
**Purpose**: Register a new admin in the system

#### Step 1: Create Interface (user.interface.ts)

```typescript
// Add this interface to user.interface.ts

export interface ICreateAdmin {
  password: string;
  admin: {
    name: string;
    email: string;
    profilePhoto?: string;
    contactNumber: string;
  };
}
```

**💡 Explanation**:

- This interface defines what data we need to create an admin
- `password` is for the user account
- `admin` object contains admin-specific information
- `?` means the field is optional

---

#### Step 2: Create Zod Validation Schema (user.validation.ts)

```typescript
// Add this to user.validation.ts

const createAdminValidationSchema = z.object({
  body: z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    admin: z.object({
      name: z.string().min(1, "Name is required"),
      email: z.email("Invalid email format"),
      profilePhoto: z.url("Invalid URL format").optional(),
      contactNumber: z.string().min(1, "Contact number is required"),
    }),
  }),
});

// Export it
export const UserValidation = {
  createDoctorValidationSchema,
  createAdminValidationSchema, // Add this
};
```

**💡 Explanation - Zod v4 Syntax**:

- ✅ **NEW in v4**: Use `z.email()` directly (NOT `z.string().email()`)
- ✅ **NEW in v4**: Use `z.url()` directly (NOT `z.string().url()`)
- ✅ Error messages: Pass string directly as parameter: `.min(6, "message")`
- ✅ Old v3 syntax `{ message: "..." }` still works but direct string is cleaner
- `.optional()` - makes field optional

---

#### Step 3: Create Service Function (user.service.ts)

```typescript
// Add this function to user.service.ts

const createAdmin = async (payload: ICreateAdmin) => {
  // Step 1: Check if user already exists
  const userExists = await prisma.user.findUnique({
    where: {
      email: payload.admin.email,
    },
  });

  if (userExists) {
    throw new Error("User with this email already exists");
  }

  // Step 2: Create user account with Better Auth
  const userData = await auth.api.signUpEmail({
    body: {
      email: payload.admin.email,
      password: payload.password,
      role: UserRole.ADMIN,
      name: payload.admin.name,
      needPasswordChange: true,
      rememberMe: false,
    },
  });

  // Step 3: Create admin profile in transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create admin record
      const admin = await tx.admin.create({
        data: {
          userId: userData.user.id,
          name: payload.admin.name,
          email: payload.admin.email,
          profilePhoto: payload.admin.profilePhoto,
          contactNumber: payload.admin.contactNumber,
        },
      });

      // Fetch created admin with user data
      const createdAdmin = await tx.admin.findUnique({
        where: { id: admin.id },
        select: {
          id: true,
          name: true,
          email: true,
          profilePhoto: true,
          contactNumber: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      });

      return createdAdmin;
    });

    return result;
  } catch (error) {
    // Cleanup: Delete user if admin creation fails
    await prisma.user.delete({
      where: { id: userData.user.id },
    });
    throw new Error("Failed to create admin");
  }
};

// Update the export
export const UserService = {
  createDoctor,
  createAdmin, // Add this
};
```

**💡 Explanation**:

- First we check if email already exists (prevent duplicates)
- Then we create the user account with Better Auth
- Then we create the admin profile in a transaction
- If anything fails, we delete the user account (cleanup)
- Transaction ensures data consistency

---

#### Step 4: Create Controller (user.controller.ts)

```typescript
// Add this to user.controller.ts

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.createAdmin(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Admin created successfully",
    data: result,
  });
});

// Update the export
export const UserController = {
  createDoctor,
  createAdmin, // Add this
};
```

**💡 Explanation**:

- `catchAsync` automatically catches errors
- We call the service function with request body
- We send a formatted response with status 201 (Created)

---

#### Step 5: Create Route (user.route.ts)

```typescript
// Add this route to user.route.ts

router.post(
  "/create-admin",
  checkAuth("SUPER_ADMIN"), // Only super admin can create admin
  validateRequest(UserValidation.createAdminValidationSchema),
  UserController.createAdmin,
);
```

**💡 Explanation**:

- Route is `/create-admin`
- `checkAuth("SUPER_ADMIN")` ensures only super admins can access
- `validateRequest` validates the data using Zod schema
- Finally calls the controller function

---

#### ✅ Testing Task 1.1

**Test Case 1: Success**

```http
POST /api/users/create-admin
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
    "password": "admin123",
    "admin": {
        "name": "John Admin",
        "email": "john.admin@example.com",
        "contactNumber": "+1234567890",
        "profilePhoto": "https://example.com/photo.jpg"
    }
}
```

**Expected Response** (201 Created):

```json
{
  "success": true,
  "message": "Admin created successfully",
  "data": {
    "id": "...",
    "name": "John Admin",
    "email": "john.admin@example.com",
    "contactNumber": "+1234567890",
    "user": {
      "id": "...",
      "role": "ADMIN"
    }
  }
}
```

**Test Case 2: Duplicate Email**

- Try creating admin with existing email
- Should get error: "User with this email already exists"

**Test Case 3: Validation Error**

- Try without password
- Should get validation error

**Test Case 4: Unauthorized**

- Try without token or with DOCTOR token
- Should get 403 Forbidden

---

### Task 1.2: Create Super Admin API

**Endpoint**: `POST /api/users/create-super-admin`  
**Access**: Only existing SUPER_ADMIN can create new super admins  
**Purpose**: Register a new super admin in the system

#### Instructions

Follow the **EXACT SAME PATTERN** as Task 1.1, but:

1. **Interface Name**: `ICreateSuperAdmin`
2. **Validation Name**: `createSuperAdminValidationSchema`
3. **Service Function**: `createSuperAdmin`
4. **Controller Function**: `createSuperAdmin`
5. **Route**: `/create-super-admin`
6. **Role**: `UserRole.SUPER_ADMIN`
7. **Table**: `superAdmin` (instead of `admin`)

#### Hints

- Super Admin fields are similar to Admin
- Check your Prisma schema for exact field names
- Use the same transaction pattern
- Use the same error handling

---

## 📦 MODULE 2: DOCTOR MODULE

First, create the Doctor module structure:

```bash
# Create folder and files
mkdir src/app/modules/doctor
touch src/app/modules/doctor/doctor.controller.ts
touch src/app/modules/doctor/doctor.service.ts
touch src/app/modules/doctor/doctor.route.ts
touch src/app/modules/doctor/doctor.interface.ts
touch src/app/modules/doctor/doctor.validation.ts
```

### Task 2.1: Get All Doctors API

**Endpoint**: `GET /api/doctors`  
**Access**: Any authenticated user (ADMIN, SUPER_ADMIN, DOCTOR)  
**Purpose**: Get list of all doctors with filtering and pagination

#### Step 1: Create Interface (doctor.interface.ts)

```typescript
// No filter interface needed - we'll just get all doctors
```

---

#### Step 2: Create Service Function (doctor.service.ts)

```typescript
import { prisma } from "../../lib/prisma";

const getAllDoctors = async () => {
  // Fetch all non-deleted doctors
  const result = await prisma.doctor.findMany({
    where: {
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      profilePhoto: true,
      contactNumber: true,
      registrationNumber: true,
      experience: true,
      gender: true,
      appointmentFee: true,
      qualification: true,
      currentWorkingPlace: true,
      designation: true,
      averageRating: true,
      createdAt: true,
      updatedAt: true,
      specialties: {
        select: {
          specialty: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  // Transform specialties (flatten structure)
  const doctors = result.map((doctor) => ({
    ...doctor,
    specialties: doctor.specialties.map((s) => s.specialty),
  }));

  return doctors;
};

export const DoctorService = {
  getAllDoctors,
};
```

**💡 Explanation**:

- Very simple logic - just fetch all doctors
- Only filter: exclude deleted doctors (`isDeleted: false`)
- Order by newest first (`createdAt: desc`)
- No pagination - returns all records
- No complex filtering or searching
- Transform specialties to flatten the structure

---

#### Step 3: Create Controller (doctor.controller.ts)

```typescript
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { DoctorService } from "./doctor.service";

const getAllDoctors = catchAsync(async (req: Request, res: Response) => {
  const result = await DoctorService.getAllDoctors();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctors retrieved successfully",
    data: result,
  });

export const DoctorController = {
  getAllDoctors,
};
```

**💡 Explanation**:

- Very simple - just call the service function
- No need to handle query parameters
- Just send the data in response

---

#### Step 4: Create Route (doctor.route.ts)

```typescript
import express from "express";
import { DoctorController } from "./doctor.controller";
import { checkAuth } from "../../middlewares/checkAuth";

const router = express.Router();

// Get all doctors - accessible by ADMIN, SUPER_ADMIN, and DOCTOR
router.get(
  "/",
  checkAuth("ADMIN", "SUPER_ADMIN", "DOCTOR"),
  DoctorController.getAllDoctors,
);

export const DoctorRoutes = router;
```

**💡 Explanation - Role-Based Authentication**:

- `checkAuth("ADMIN", "SUPER_ADMIN", "DOCTOR")` means:
  - ✅ **ADMIN** can access (admins manage doctors)
  - ✅ **SUPER_ADMIN** can access (super admins have highest access)
  - ✅ **DOCTOR** can access (doctors can view other doctors)
  - ❌ **PATIENT** cannot access (not in the list)
  - ❌ Unauthenticated users cannot access (no token)

**💡 Tip**: Don't forget to register this route in `src/app/routes/index.ts`:

```typescript
{
    path: "/doctors",
    route: DoctorRoutes
}
```

---

#### ✅ Testing Task 2.1

**Test Case: Get All Doctors**

```http
GET /api/doctors
Authorization: Bearer <token>
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "data": [
    {
      "id": "...",
      "name": "Dr. John Doe",
      "email": "john@example.com",
      "contactNumber": "+1234567890",
      "specialties": [
        {
          "id": "...",
          "title": "Cardiology"
        }
      ],
      "appointmentFee": 100,
      "createdAt": "..."
    }
    // ... more doctors
  ]
}
```

---

### Task 2.2: Get Doctor by ID API

**Endpoint**: `GET /api/doctors/:id`  
**Access**: Any authenticated user  
**Purpose**: Get detailed information about a specific doctor

#### Step 1: Create Service Function

```typescript
const getDoctorById = async (id: string) => {
  const doctor = await prisma.doctor.findUnique({
    where: {
      id,
      isDeleted: false,
    },
    include: {
      specialties: {
        include: {
          specialty: true,
        },
      },
    },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  // Transform specialties to flatten structure
  return {
    ...doctor,
    specialties: doctor.specialties.map((s) => s.specialty),
  };
};

// Add to export
export const DoctorService = {
  getAllDoctors,
  getDoctorById,
};
```

**💡 Explanation**:

- Simple logic - find doctor by ID
- Filter out deleted doctors
- Use `include` to get related data (simpler than select)
- Transform specialties to remove junction table fields
- Throw error if doctor not found

````

---

#### Step 2: Create Controller

```typescript
const getDoctorById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await DoctorService.getDoctorById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctor retrieved successfully",
    data: result,
  });
});

// Add to export
export const DoctorController = {
  getAllDoctors,
  getDoctorById,
};
````

---

#### Step 3: Create Route

```typescript
// Get doctor by ID - same access as above
router.get(
  "/:id",
  checkAuth("ADMIN", "SUPER_ADMIN", "DOCTOR"),
  DoctorController.getDoctorById,
);
```

---

#### ✅ Testing Task 2.2

```http
GET /api/doctors/019c2f7f-87f8-7078-951a-3b2326c8d60a
Authorization: Bearer <token>
```

---

### Task 2.3: Update Doctor API

**Endpoint**: `PATCH /api/doctors/:id`  
**Access**: ADMIN, SUPER_ADMIN, or the DOCTOR themselves  
**Purpose**: Update doctor information

#### Step 1: Create Interface

```typescript
export interface IUpdateDoctor {
  name?: string;
  profilePhoto?: string;
  contactNumber?: string;
  registrationNumber?: string;
  experience?: number;
  gender?: string;
  appointmentFee?: number;
  qualification?: string;
  currentWorkingPlace?: string;
  designation?: string;
  specialties?: string[]; // Array of specialty IDs to update
}
```

---

#### Step 2: Create Validation Schema

```typescript
const updateDoctorValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    profilePhoto: z.url("Invalid URL format").optional(),
    contactNumber: z.string().optional(),
    registrationNumber: z.string().optional(),
    experience: z
      .int("Experience must be a whole number")
      .min(0, "Experience cannot be negative")
      .optional(),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    appointmentFee: z
      .number()
      .positive("Appointment fee must be positive")
      .optional(),
    qualification: z.string().optional(),
    currentWorkingPlace: z.string().optional(),
    designation: z.string().optional(),
    specialties: z
      .array(z.uuid("Each specialty ID must be a valid UUID"))
      .optional(),
  }),
});

export const DoctorValidation = {
  updateDoctorValidationSchema,
};
```

**💡 Important - Zod v4 Changes**:

- ✅ `z.url()` - NOT `z.string().url()`
- ✅ `z.uuid()` - NOT `z.string().uuid()`
- ✅ `z.int()` - NOT `z.number().int()`
- ✅ `z.email()` - NOT `z.string().email()`
- ✅ `z.enum([...])` - Just pass array directly (error message optional)

```typescript
const updateDoctor = async (id: string, payload: IUpdateDoctor) => {
  // Check if doctor exists and not deleted
  const existingDoctor = await prisma.doctor.findUnique({
    where: { id, isDeleted: false },
  });

  if (!existingDoctor) {
    throw new Error("Doctor not found");
  }

  // Separate specialties from doctor data
  const { specialties, ...doctorData } = payload;

  // Update doctor basic information
  const updatedDoctor = await prisma.doctor.update({
    where: { id },
    data: doctorData,
    include: {
      specialties: {
        include: {
          specialty: true,
        },
      },
    },
  });

  // If specialties are provided, update them separately
  if (specialties && specialties.length > 0) {
    // Delete old specialties
    await prisma.doctorSpecialty.deleteMany({
      where: { doctorId: id },
    });

    // Add new specialties
    const specialtiesData = specialties.map((specialtyId) => ({
      doctorId: id,
      specialtyId,
    }));

    await prisma.doctorSpecialty.createMany({
      data: specialtiesData,
    });

    // Fetch updated doctor with new specialties
    const result = await prisma.doctor.findUnique({
      where: { id },
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
      },
    });

    return {
      ...result,
      specialties: result?.specialties.map((s) => s.specialty) || [],
    };
  }

  // Return updated doctor with transformed specialties
  return {
    ...updatedDoctor,
    specialties: updatedDoctor.specialties.map((s) => s.specialty),
  };
};

// Add to export
export const DoctorService = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
};
```

**💡 Explanation**:

- First check if doctor exists and is not deleted
- Separate specialties from other doctor data
- Update basic doctor info using Prisma update
- If specialties provided, delete old ones and create new ones
- Fetch updated doctor with new specialties
- Transform specialties to flatten structure
- Return updated doctor with clean specialty array

````

---

#### Step 4: Create Controller

```typescript
const updateDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await DoctorService.updateDoctor(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctor updated successfully",
    data: result,
  });
});

// Add to export
export const DoctorController = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
};
````

---

#### Step 5: Create Route

```typescript
import { validateRequest } from "../../middlewares/validateRequest";
import { DoctorValidation } from "./doctor.validation";

// Update doctor - ADMIN, SUPER_ADMIN, or the DOCTOR themselves
router.patch(
  "/:id",
  checkAuth("ADMIN", "SUPER_ADMIN", "DOCTOR"),
  validateRequest(DoctorValidation.updateDoctorValidationSchema),
  DoctorController.updateDoctor,
);

// 💡 Note: DOCTOR can update their own profile
// In production, you should add logic to ensure doctors can only update their own profile
```

---

#### ✅ Testing Task 2.3

```http
PATCH /api/doctors/019c2f7f-87f8-7078-951a-3b2326c8d60a
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "Dr. Updated Name",
    "appointmentFee": 150,
    "specialties": ["specialty-id-1", "specialty-id-2"]
}
```

---

### Task 2.4: Soft Delete Doctor API

**Endpoint**: `DELETE /api/doctors/:id`  
**Access**: ADMIN, SUPER_ADMIN only  
**Purpose**: Soft delete a doctor (mark as deleted, don't remove from database)

#### Step 1: Create Service Function

```typescript
const softDeleteDoctor = async (id: string) => {
  // Check if doctor exists and not already deleted
  const doctor = await prisma.doctor.findUnique({
    where: { id },
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  if (doctor.isDeleted) {
    throw new Error("Doctor is already deleted");
  }

  // Mark doctor as deleted
  const result = await prisma.doctor.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  return result;
};

// Add to export
export const DoctorService = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  softDeleteDoctor,
};
```

**💡 Explanation**:

- Check if doctor exists
- Check if already deleted (prevent duplicate deletion)
- Update `isDeleted` to `true` and set `deletedAt` timestamp
- This is called "soft delete" - data stays in database but marked as deleted
- Return the updated doctor record

````

**💡 Note**: Make sure your Prisma schema has `deletedAt` field:

```prisma
model Doctor {
  // ... other fields
  isDeleted  Boolean   @default(false)
  deletedAt  DateTime?
}
````

---

#### Step 2: Create Controller

```typescript
const softDeleteDoctor = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await DoctorService.softDeleteDoctor(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Doctor deleted successfully",
    data: result,
  });
});

// Add to export
export const DoctorController = {
  getAllDoctors,
  getDoctorById,
  updateDoctor,
  softDeleteDoctor,
};
```

---

#### Step 3: Create Route

```typescript
// Soft delete doctor - ONLY ADMIN and SUPER_ADMIN can delete
router.delete(
  "/:id",
  checkAuth("ADMIN", "SUPER_ADMIN"),
  DoctorController.softDeleteDoctor,
);

// 💡 Security Note:
// - Doctors CANNOT delete themselves
// - Doctors CANNOT delete other doctors
// - Only ADMIN and SUPER_ADMIN have delete permission
```

---

#### ✅ Testing Task 2.4

```http
DELETE /api/doctors/019c2f7f-87f8-7078-951a-3b2326c8d60a
Authorization: Bearer <admin_token>
```

**Expected Response**:

```json
{
  "success": true,
  "message": "Doctor deleted successfully",
  "data": {
    "id": "019c2f7f-87f8-7078-951a-3b2326c8d60a",
    "isDeleted": true,
    "deletedAt": "2026-02-06T10:30:00.000Z"
  }
}
```

---

## 📦 MODULE 3: ADMIN MODULE

### Overview

Now you need to implement the **EXACT SAME 4 CRUD operations** for Admin module:

1. **Get All Admins** - Fetch all non-deleted admins (no pagination/filtering)
2. **Get Admin by ID** - Fetch single admin by ID
3. **Update Admin** - Update admin information
4. **Soft Delete Admin** - Mark admin as deleted

### Instructions

Follow the **SAME SIMPLE PATTERN** as Doctor Module (Tasks 2.1 to 2.4), but:

1. **Replace** `Doctor` with `Admin` everywhere
2. **Replace** `doctor` with `admin` everywhere
3. **Remove** specialties logic (Admin doesn't have specialties)
4. **Check** Prisma schema: `prisma/schema/admin.prisma` for exact field names
5. **Use same Zod v4 syntax**: `z.email()`, `z.url()`, etc.

### Key Differences from Doctor Module:

- ❌ **No specialties** - Remove all specialty-related code
- ✅ **Simpler structure** - Just basic admin fields
- ✅ **Same patterns** - getAllAdmins, getAdminById, updateAdmin, softDeleteAdmin

### Admin Module Structure

```
src/app/modules/admin/
├── admin.controller.ts
├── admin.service.ts
├── admin.route.ts
├── admin.interface.ts
└── admin.validation.ts
```

### Admin Fields (Check your schema)

Typical Admin fields:

- id
- userId
- name
- email
- profilePhoto
- contactNumber
- isDeleted
- deletedAt
- createdAt
- updatedAt

### Checklist for Admin Module

- [ ] Task 3.1: Get All Admins
  - [ ] Create interface `IAdminFilterRequest`
  - [ ] Create service `getAllAdmins`
  - [ ] Create controller `getAllAdmins`
  - [ ] Create route `GET /api/admins`
  - [ ] Test with different filters
- [ ] Task 3.2: Get Admin by ID
  - [ ] Create service `getAdminById`
  - [ ] Create controller `getAdminById`
  - [ ] Create route `GET /api/admins/:id`
  - [ ] Test with valid and invalid IDs
- [ ] Task 3.3: Update Admin
  - [ ] Create interface `IUpdateAdmin`
  - [ ] Create validation schema `updateAdminValidationSchema`
  - [ ] Create service `updateAdmin`
  - [ ] Create controller `updateAdmin`
  - [ ] Create route `PATCH /api/admins/:id`
  - [ ] Test update operations
- [ ] Task 3.4: Soft Delete Admin
  - [ ] Create service `softDeleteAdmin`
  - [ ] Create controller `softDeleteAdmin`
  - [ ] Create route `DELETE /api/admins/:id`
  - [ ] Test deletion

---

## 📦 MODULE 4: SUPER ADMIN MODULE

### Overview

Implement the **SAME 4 CRUD operations** for Super Admin module:

1. Get All Super Admins
2. Get Super Admin by ID
3. Update Super Admin
4. Soft Delete Super Admin

### Instructions

Follow the **SAME PATTERN** as Admin Module, but:

1. Replace `Admin` with `SuperAdmin` everywhere
2. Replace `admin` with `superAdmin` everywhere
3. Route path: `/api/super-admins` (with hyphen)
4. Check Prisma schema for SuperAdmin model fields

### Super Admin Module Structure

```
src/app/modules/superAdmin/
├── superAdmin.controller.ts
├── superAdmin.service.ts
├── superAdmin.route.ts
├── superAdmin.interface.ts
└── superAdmin.validation.ts
```

### Checklist for Super Admin Module

- [ ] Task 4.1: Get All Super Admins
- [ ] Task 4.2: Get Super Admin by ID
- [ ] Task 4.3: Update Super Admin
- [ ] Task 4.4: Soft Delete Super Admin

---

## 📦 MODULE 5: DATABASE SCHEMA MODELS

### 🎯 Overview

Before building APIs, you need to create the database schema for the remaining healthcare features. You will create **6 new Prisma models** with proper relationships.

**Purpose**: These models will store data for appointments, schedules, reviews, patient health records, and medical reports.

---

### Task 5.1: Create Schedule Model

**File**: `prisma/schema/schedule.prisma`

**Purpose**: Doctors set their available time slots for appointments.

#### Step-by-Step Instructions

1. **Create the file** `prisma/schema/schedule.prisma`

2. **Add this code**:

```prisma
model Schedule {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  startDate DateTime
  endDate   DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  doctorSchedules DoctorSchedules[]

  @@map("schedules")
}
```

**💡 Explanation**:

- `id` - Unique identifier for each schedule slot
- `startDate` - When the schedule slot starts (e.g., "2026-02-10 09:00:00")
- `endDate` - When the schedule slot ends (e.g., "2026-02-10 10:00:00")
- `doctorSchedules` - **One schedule can be assigned to many doctors** (one-to-many relationship)
- `@@map("schedules")` - Database table name

**🔗 Relationship**: One schedule → Many doctors can use it

---

### Task 5.2: Create DoctorSchedules Model (Junction Table)

**File**: `prisma/schema/doctor.prisma` (add to existing file)

**Purpose**: Links doctors to their available schedules. This is a **many-to-many** relationship between Doctor and Schedule.

#### Step-by-Step Instructions

Add this model to `prisma/schema/doctor.prisma`:

```prisma
model DoctorSchedules {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  doctorId   String   @db.Uuid
  scheduleId String   @db.Uuid
  isBooked   Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Relations
  doctor   Doctor   @relation(fields: [doctorId], references: [id])
  schedule Schedule @relation(fields: [scheduleId], references: [id])

  // An appointment is associated with this specific doctor's schedule slot
  appointment Appointment?

  @@unique([doctorId, scheduleId])
  @@map("doctor_schedules")
}
```

**💡 Explanation**:

- `doctorId` - Which doctor?
- `scheduleId` - Which time slot?
- `isBooked` - Is this slot already booked? (true/false)
- `doctor` - Points to the Doctor model
- `schedule` - Points to the Schedule model
- `appointment` - One slot can have ONE appointment (one-to-one)
- `@@unique([doctorId, scheduleId])` - **Same doctor cannot have same schedule twice**

**🔗 Relationships**:

- Many doctors → Many schedules (through this junction table)
- One doctor schedule slot → One appointment

---

### Task 5.3: Update Doctor Model

**File**: `prisma/schema/doctor.prisma`

Add this field to the existing Doctor model:

```prisma
model Doctor {
  // ... existing fields ...

  // Add this new relation field:
  doctorSchedules DoctorSchedules[]

  // ... rest of existing fields ...
}
```

**💡 Explanation**: One doctor can have many schedule slots.

---

### Task 5.4: Create Appointment Model

**File**: `prisma/schema/appointment.prisma`

**Purpose**: Stores all appointment bookings between patients and doctors.

#### Step-by-Step Instructions

1. **Create the file** `prisma/schema/appointment.prisma`

2. **Add this code**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

model Appointment {
  id                 String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  patientId          String   @db.Uuid
  doctorId           String   @db.Uuid
  doctorScheduleId   String   @unique @db.Uuid
  videoCallingId     String
  status             AppointmentStatus @default(SCHEDULED)
  paymentStatus      PaymentStatus @default(UNPAID)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  // Relations
  patient        Patient         @relation(fields: [patientId], references: [id])
  doctor         Doctor          @relation(fields: [doctorId], references: [id])
  doctorSchedule DoctorSchedules @relation(fields: [doctorScheduleId], references: [id])

  // One appointment can have one payment, review, prescription, and medical report
  payment         Payment?
  review          Review?
  prescription    Prescription?
  medicalReport   MedicalReport?

  @@map("appointments")
}
```

**💡 Explanation**:

- `patientId` - Which patient booked this?
- `doctorId` - Which doctor?
- `doctorScheduleId` - Which specific time slot? (UNIQUE - one slot = one appointment)
- `videoCallingId` - ID for video call link
- `status` - SCHEDULED, INPROGRESS, COMPLETED, CANCELED
- `paymentStatus` - PAID or UNPAID
- `patient`, `doctor`, `doctorSchedule` - Foreign key relationships
- `payment`, `review`, `prescription`, `medicalReport` - Optional one-to-one relationships

**🔗 Relationships**:

- One patient → Many appointments
- One doctor → Many appointments
- One doctor schedule slot → ONE appointment (unique)
- One appointment → One payment (optional)
- One appointment → One review (optional)
- One appointment → One prescription (optional)
- One appointment → One medical report (optional)

---

### Task 5.5: Create Review Model

**File**: `prisma/schema/review.prisma`

**Purpose**: Patients can review doctors after appointments.

#### Step-by-Step Instructions

1. **Create the file** `prisma/schema/review.prisma`

2. **Add this code**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

model Review {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  patientId     String   @db.Uuid
  doctorId      String   @db.Uuid
  appointmentId String   @unique @db.Uuid
  rating        Float
  comment       String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  patient     Patient     @relation(fields: [patientId], references: [id])
  doctor      Doctor      @relation(fields: [doctorId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])

  @@map("reviews")
}
```

**💡 Explanation**:

- `patientId` - Who wrote the review?
- `doctorId` - Who is being reviewed?
- `appointmentId` - Which appointment? (UNIQUE - one review per appointment)
- `rating` - Star rating (e.g., 4.5 out of 5)
- `comment` - Optional text review
- All three relations connect to their respective models

**🔗 Relationships**:

- One patient → Many reviews (can review multiple doctors)
- One doctor → Many reviews (can be reviewed by multiple patients)
- One appointment → ONE review (unique)

---

### Task 5.6: Create PatientHealthData Model

**File**: `prisma/schema/patientHealthData.prisma`

**Purpose**: Stores patient's health information like blood type, allergies, etc.

#### Step-by-Step Instructions

1. **Create the file** `prisma/schema/patientHealthData.prisma`

2. **Add this code**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

model PatientHealthData {
  id                  String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  patientId           String        @unique @db.Uuid
  gender              Gender
  dateOfBirth         DateTime
  bloodGroup          BloodGroup
  hasAllergies        Boolean       @default(false)
  hasDiabetes         Boolean       @default(false)
  height              String
  weight              String
  smokingStatus       Boolean       @default(false)
  dietaryPreferences  String?
  pregnancyStatus     Boolean       @default(false)
  mentalHealthHistory String?
  immunizationStatus  String?
  hasPastSurgeries    Boolean       @default(false)
  recentAnxiety       Boolean       @default(false)
  recentDepression    Boolean       @default(false)
  maritalStatus       MaritalStatus @default(UNMARRIED)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  // Relations
  patient Patient @relation(fields: [patientId], references: [id])

  @@map("patient_health_data")
}
```

**💡 Explanation**:

- `patientId` - Which patient? (UNIQUE - one patient = one health data record)
- Health fields - All medical information about the patient
- `gender`, `bloodGroup`, `maritalStatus` - Use enums (must be defined in `enums.prisma`)
- Boolean fields - Simple yes/no questions (hasAllergies, hasDiabetes, etc.)
- Optional fields (`?`) - Can be null

**🔗 Relationship**: One patient → ONE health data record (one-to-one)

---

### Task 5.7: Create MedicalReport Model

**File**: `prisma/schema/medicalReport.prisma`

**Purpose**: Doctors create medical reports after appointments.

#### Step-by-Step Instructions

1. **Create the file** `prisma/schema/medicalReport.prisma`

2. **Add this code**:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

model MedicalReport {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  patientId     String   @db.Uuid
  doctorId      String   @db.Uuid
  appointmentId String   @unique @db.Uuid
  diagnosis     String
  treatment     String
  followUpDate  DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  patient     Patient     @relation(fields: [patientId], references: [id])
  doctor      Doctor      @relation(fields: [doctorId], references: [id])
  appointment Appointment @relation(fields: [appointmentId], references: [id])

  @@map("medical_reports")
}
```

**💡 Explanation**:

- `patientId` - Which patient?
- `doctorId` - Which doctor created this?
- `appointmentId` - For which appointment? (UNIQUE - one report per appointment)
- `diagnosis` - What's the problem?
- `treatment` - What's the solution?
- `followUpDate` - When should patient come back? (optional)

**🔗 Relationships**:

- One patient → Many medical reports
- One doctor → Many medical reports (they can create many)
- One appointment → ONE medical report (unique)

---

### Task 5.8: Update Patient and Doctor Models

**File**: `prisma/schema/patient.prisma`

Add these relation fields to the existing Patient model:

```prisma
model Patient {
  // ... existing fields ...

  // Add these new relation fields:
  patientHealthData PatientHealthData?
  appointments      Appointment[]
  reviews           Review[]
  medicalReports    MedicalReport[]

  // ... rest of existing fields ...
}
```

**File**: `prisma/schema/doctor.prisma`

Add these relation fields to the existing Doctor model:

```prisma
model Doctor {
  // ... existing fields ...

  // Add these new relation fields:
  appointments      Appointment[]
  reviews           Review[]
  medicalReports    MedicalReport[]

  // ... rest of existing fields ...
}
```

---

### Task 5.9: Update Enums (If Not Present)

**File**: `prisma/schema/enums.prisma`

Make sure these enums exist. Add any missing ones:

```prisma
enum AppointmentStatus {
  SCHEDULED
  INPROGRESS
  COMPLETED
  CANCELED
}

enum PaymentStatus {
  PAID
  UNPAID
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum BloodGroup {
  A_POSITIVE
  A_NEGATIVE
  B_POSITIVE
  B_NEGATIVE
  AB_POSITIVE
  AB_NEGATIVE
  O_POSITIVE
  O_NEGATIVE
}

enum MaritalStatus {
  MARRIED
  UNMARRIED
  DIVORCED
  WIDOWED
}
```

---

### 🎯 Understanding the Complete ERD (Entity Relationship Diagram)

Here's how all models connect:

```
Patient
  ├─ ONE-TO-ONE → PatientHealthData
  ├─ ONE-TO-MANY → Appointment
  ├─ ONE-TO-MANY → Review
  └─ ONE-TO-MANY → MedicalReport

Doctor
  ├─ ONE-TO-MANY → DoctorSchedules
  ├─ ONE-TO-MANY → Appointment
  ├─ ONE-TO-MANY → Review
  └─ ONE-TO-MANY → MedicalReport

Schedule
  └─ ONE-TO-MANY → DoctorSchedules

DoctorSchedules (Junction Table)
  ├─ MANY-TO-ONE → Doctor
  ├─ MANY-TO-ONE → Schedule
  └─ ONE-TO-ONE → Appointment

Appointment
  ├─ MANY-TO-ONE → Patient
  ├─ MANY-TO-ONE → Doctor
  ├─ ONE-TO-ONE → DoctorSchedules
  ├─ ONE-TO-ONE → Payment (optional)
  ├─ ONE-TO-ONE → Review (optional)
  ├─ ONE-TO-ONE → Prescription (optional)
  └─ ONE-TO-ONE → MedicalReport (optional)

Review
  ├─ MANY-TO-ONE → Patient
  ├─ MANY-TO-ONE → Doctor
  └─ ONE-TO-ONE → Appointment

MedicalReport
  ├─ MANY-TO-ONE → Patient
  ├─ MANY-TO-ONE → Doctor
  └─ ONE-TO-ONE → Appointment
```

---

### 📋 Relationship Types Explained

#### 1. **One-to-One (1:1)**

**Example**: Patient ↔ PatientHealthData

- One patient has EXACTLY ONE health data record
- One health data record belongs to EXACTLY ONE patient

**Prisma Code**:

```prisma
// In Patient model
patientHealthData PatientHealthData?

// In PatientHealthData model
patient Patient @relation(fields: [patientId], references: [id])
patientId String @unique @db.Uuid  // UNIQUE makes it one-to-one
```

#### 2. **One-to-Many (1:N)**

**Example**: Patient → Appointments

- One patient can have MANY appointments
- One appointment belongs to EXACTLY ONE patient

**Prisma Code**:

```prisma
// In Patient model
appointments Appointment[]  // Array means "many"

// In Appointment model
patient Patient @relation(fields: [patientId], references: [id])
patientId String @db.Uuid  // Not unique, so many appointments can have same patient
```

#### 3. **Many-to-Many (M:N)**

**Example**: Doctor ↔ Schedule (through DoctorSchedules)

- One doctor can have MANY schedules
- One schedule can belong to MANY doctors
- **Need a junction table** (DoctorSchedules) to connect them

**Prisma Code**:

```prisma
// Doctor model
doctorSchedules DoctorSchedules[]

// Schedule model
doctorSchedules DoctorSchedules[]

// Junction table: DoctorSchedules
model DoctorSchedules {
  doctor Doctor @relation(fields: [doctorId], references: [id])
  schedule Schedule @relation(fields: [scheduleId], references: [id])
  @@unique([doctorId, scheduleId])  // Prevents duplicates
}
```

---

### ✅ Schema Checklist

Before running migrations, verify:

- [ ] All files created in correct locations
- [ ] All `generator client` blocks have same `output` path
- [ ] All relations are bidirectional (both sides defined)
- [ ] All foreign keys use `@db.Uuid` type
- [ ] All enum values match (check `enums.prisma`)
- [ ] All `@@unique` constraints are in place
- [ ] All `@@map()` directives use snake_case
- [ ] No typos in field names or model names

---

### 🚀 Running Migrations

After creating all schema files:

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_healthcare_models

# Open Prisma Studio to verify
npx prisma studio
```

**💡 Common Errors**:

1. **"Field X does not exist"** → Check spelling in relations
2. **"Generator output conflicts"** → Make sure all `output` paths are same
3. **"Enum Y is not defined"** → Add enum to `enums.prisma`
4. **"Foreign key constraint fails"** → Check if foreign key field types match

---

### 🎓 Why These Models Matter

| Model                 | Purpose in Healthcare System                              |
| --------------------- | --------------------------------------------------------- |
| **Schedule**          | Defines available time slots doctors can work             |
| **DoctorSchedules**   | Assigns specific time slots to specific doctors           |
| **Appointment**       | Records patient bookings with doctors                     |
| **Review**            | Allows patients to rate and review doctors                |
| **PatientHealthData** | Stores complete medical history of patients               |
| **MedicalReport**     | Doctor's diagnosis and treatment notes after appointments |

---

### 💡 Real-World Example Flow

1. **Admin creates schedule**: "Monday 9 AM - 10 AM"
2. **Doctor adds to their schedule**: "I'm available Monday 9-10 AM"
3. **Patient books appointment**: Selects doctor + time slot
4. **Doctor sees patient**: Appointment happens
5. **Doctor creates medical report**: Diagnosis + treatment
6. **Patient leaves review**: 5-star rating + comment
7. **System calculates**: Doctor's average rating updates

---

## 🧪 Testing Guidelines

### Tools You'll Need

1. **Postman** or **Thunder Client** (VS Code Extension)
2. **Database GUI** (Prisma Studio, pgAdmin, etc.)

### Testing Checklist for Each API

For **EVERY** API you create, test:

1. ✅ **Success Case**
   - Valid data
   - Valid token
   - Correct permissions

2. ✅ **Validation Error**
   - Missing required fields
   - Invalid data format
   - Invalid data types

3. ✅ **Authentication Error**
   - No token
   - Invalid token
   - Expired token

4. ✅ **Authorization Error**
   - Wrong role (DOCTOR trying to access ADMIN-only endpoint)

5. ✅ **Not Found Error**
   - Invalid ID
   - Deleted record

6. ✅ **Duplicate Error** (for Create APIs)
   - Existing email

### Sample Test Cases Document

Create a file `TEST_CASES.md` and document each test:

```markdown
## API: Create Admin

### Test Case 1: Success

- **Input**: Valid admin data with super admin token
- **Expected**: 201 Created with admin data
- **Actual**: ✅ Passed

### Test Case 2: Duplicate Email

- **Input**: Existing email
- **Expected**: 400 Bad Request
- **Actual**: ✅ Passed

...
```

---

## 📤 Submission Requirements

### What to Submit

1. **Source Code**
   - All module files (controller, service, route, interface, validation)
   - Updated route index file
   - Any helper utilities you created

2. **Documentation**
   - `TEST_CASES.md` - All your test cases and results
   - `IMPLEMENTATION_NOTES.md` - Any challenges, solutions, or notes
   - Screenshots of successful API tests (at least 2 per module)

3. **Database**
   - Include sample data (at least 2 records per role)
   - Prisma schema changes (if any)

### Submission Format

```
Your Name - Task Assignment 1
├── src/
│   └── app/
│       └── modules/
│           ├── user/
│           ├── doctor/
│           ├── admin/
│           └── superAdmin/
├── TEST_CASES.md
├── IMPLEMENTATION_NOTES.md
└── screenshots/
    ├── create-admin-success.png
    ├── get-doctors-success.png
    └── ...
```

### Submission Method

[Your instructor will specify: GitHub, Email, LMS, etc.]

---

## 📊 Grading Criteria

### Total Points: 100

| Category          | Points | Description                                     |
| ----------------- | ------ | ----------------------------------------------- |
| **Code Quality**  | 30     | Clean code, proper naming, comments, structure  |
| **Functionality** | 40     | All APIs work correctly, handle errors properly |
| **Validation**    | 10     | Proper Zod validation, error messages           |
| **Testing**       | 10     | Comprehensive test cases, documentation         |
| **Documentation** | 10     | Clear notes, good README, comments              |

### Detailed Rubric

#### Code Quality (30 points)

- [10] Follows existing project patterns
- [10] Proper TypeScript usage (types, interfaces)
- [5] Meaningful variable/function names
- [5] Code is well-commented

#### Functionality (40 points)

- [20] All CRUD operations work correctly
- [10] Proper error handling
- [5] Transaction handling for Create operations
- [5] Soft delete implemented correctly

#### Validation (10 points)

- [5] All required fields validated
- [3] Proper Zod schemas
- [2] Meaningful error messages

#### Testing (10 points)

- [5] All APIs tested with success cases
- [3] Error cases tested
- [2] Edge cases tested

#### Documentation (10 points)

- [5] TEST_CASES.md complete
- [3] IMPLEMENTATION_NOTES.md helpful
- [2] Code comments present

---

## ❌ Common Mistakes to Avoid

### 1. Wrong Field Names

❌ **Wrong**:

```typescript
phone: true; // Field doesn't exist in schema
```

✅ **Correct**:

```typescript
contactNumber: true; // Use actual field name from Prisma schema
```

**Solution**: Always check your Prisma schema file first!

---

### 2. Forgetting to Check isDeleted

❌ **Wrong**:

```typescript
const doctor = await prisma.doctor.findUnique({
  where: { id },
});
// Returns deleted doctors too!
```

✅ **Correct**:

```typescript
const doctor = await prisma.doctor.findUnique({
  where: {
    id,
    isDeleted: false, // ✅ Exclude deleted
  },
});
```

---

### 3. Not Using Transactions for Multi-Step Operations

❌ **Wrong**:

```typescript
// Create admin
const admin = await prisma.admin.create({...});

// If this fails, admin is already created! ❌
await prisma.adminRole.create({...});
```

✅ **Correct**:

```typescript
await prisma.$transaction(async (tx) => {
    const admin = await tx.admin.create({...});
    await tx.adminRole.create({...});
    // Both succeed or both fail ✅
});
```

---

### 4. Forgetting to Export Functions

❌ **Wrong**:

```typescript
export const AdminService = {
  getAllAdmins,
  getAdminById,
  // ❌ Forgot to add updateAdmin
};
```

✅ **Correct**:

```typescript
export const AdminService = {
  getAllAdmins,
  getAdminById,
  updateAdmin, // ✅ Added
  softDeleteAdmin, // ✅ Added
};
```

---

### 5. Wrong HTTP Status Codes

❌ **Wrong**:

```typescript
// Creating resource
sendResponse(res, {
    statusCode: 200,  // ❌ Wrong! 200 is for general success
    ...
});
```

✅ **Correct**:

```typescript
// Creating resource
sendResponse(res, {
    statusCode: 201,  // ✅ Correct! 201 is for Created
    ...
});
```

**Status Code Guide**:

- `200` - OK (GET, UPDATE)
- `201` - Created (POST)
- `204` - No Content (DELETE)
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized (No/Invalid Token)
- `403` - Forbidden (Wrong Role)
- `404` - Not Found
- `500` - Internal Server Error

---

### 6. Not Cleaning Up on Error

❌ **Wrong**:

```typescript
const userData = await auth.api.signUpEmail({...});

// If this fails, user account is orphaned! ❌
await prisma.admin.create({
    userId: userData.user.id,
    ...
});
```

✅ **Correct**:

```typescript
const userData = await auth.api.signUpEmail({...});

try {
    await prisma.admin.create({...});
} catch (error) {
    // ✅ Cleanup: Delete the user
    await prisma.user.delete({
        where: { id: userData.user.id }
    });
    throw error;
}
```

---

### 7. Inconsistent Naming

❌ **Wrong**:

```typescript
// File: doctorController.ts
export const DoctorController = {
  getAllDoctor, // ❌ Missing 's'
  getDoctorByID, // ❌ Capital ID
  update_doctor, // ❌ Snake case
};
```

✅ **Correct**:

```typescript
// File: doctor.controller.ts
export const DoctorController = {
  getAllDoctors, // ✅ Plural
  getDoctorById, // ✅ Camel case
  updateDoctor, // ✅ Consistent
};
```

---

### 8. Not Validating Role Access

❌ **Wrong**:

```typescript
// Anyone can delete doctors! ❌
router.delete("/:id", DoctorController.softDeleteDoctor);
```

✅ **Correct**:

```typescript
// Only admins can delete ✅
router.delete(
  "/:id",
  checkAuth("ADMIN", "SUPER_ADMIN"),
  DoctorController.softDeleteDoctor,
);
```

---

### 9. Hardcoding Values

❌ **Wrong**:

```typescript
const limit = 10; // ❌ Hardcoded
const page = 1; // ❌ Hardcoded
```

✅ **Correct**:

```typescript
const { limit = 10, page = 1 } = options; // ✅ From request
```

---

### 10. Not Handling Null/Undefined

❌ **Wrong**:

```typescript
const doctor = {
  ...result,
  specialties: result.specialties.map((s) => s.specialty),
  // ❌ Crashes if specialties is null
};
```

✅ **Correct**:

```typescript
const doctor = {
  ...result,
  specialties: result?.specialties?.map((s) => s.specialty) || [],
  // ✅ Safe with optional chaining and default value
};
```

---

## 📚 Help & Resources

### When You're Stuck

1. **Review the Create Doctor Implementation**
   - It's your reference for the pattern
   - See how it's structured
   - Copy the pattern, change the names

2. **Check Prisma Schema**
   - Location: `prisma/schema/`
   - Verify field names
   - Check relationships

3. **Use TypeScript IntelliSense**
   - Let VS Code autocomplete show you available fields
   - Hover over types to see structure

4. **Check Existing Middleware**
   - `checkAuth` - for authentication
   - `validateRequest` - for validation
   - `catchAsync` - for error handling

5. **Look at Error Messages**
   - Prisma errors tell you what's wrong
   - Validation errors show which field failed
   - TypeScript errors show type mismatches

### Useful Commands

```bash
# Run development server
pnpm dev

# Open Prisma Studio (view database)
pnpm studio

# Generate Prisma Client (after schema changes)
pnpm prisma generate

# Format code
pnpm format

# Check types
pnpm type-check
```

### Questions?

If you're stuck for more than 30 minutes on the same issue:

1. Write down exactly what you tried
2. Write down the exact error message
3. Ask your instructor/mentor
4. Include code snippets in your question

### Office Hours

[Your instructor will specify times and method]

---

## ✅ Pre-Submission Checklist

Before submitting, verify:

### Module 1: User Module

- [ ] Create Admin API works
- [ ] Create Super Admin API works
- [ ] Both use Better Auth
- [ ] Both handle cleanup on error
- [ ] Both use Zod validation
- [ ] Both use checkAuth middleware
- [ ] Tested with Postman/Thunder Client

### Module 2: Doctor Module

- [ ] Get All Doctors works with filters
- [ ] Get Doctor by ID works
- [ ] Update Doctor works
- [ ] Soft Delete Doctor works
- [ ] All use checkAuth middleware
- [ ] All handle errors properly
- [ ] Tested all endpoints

### Module 3: Admin Module

- [ ] Get All Admins works
- [ ] Get Admin by ID works
- [ ] Update Admin works
- [ ] Soft Delete Admin works
- [ ] All endpoints tested

### Module 4: Super Admin Module

- [ ] Get All Super Admins works
- [ ] Get Super Admin by ID works
- [ ] Update Super Admin works
- [ ] Soft Delete Super Admin works
- [ ] All endpoints tested

### Code Quality

- [ ] No TypeScript errors
- [ ] No console.logs in production code
- [ ] Proper error messages
- [ ] Code is formatted
- [ ] Variables have meaningful names
- [ ] Functions have proper JSDoc comments

### Documentation

- [ ] TEST_CASES.md complete
- [ ] IMPLEMENTATION_NOTES.md written
- [ ] Screenshots included
- [ ] All tests documented

### Testing

- [ ] All success cases pass
- [ ] All error cases handled
- [ ] Authentication tested
- [ ] Authorization tested
- [ ] Validation tested

---

## 🎉 Conclusion

This assignment will give you hands-on experience with:

- ✅ Building RESTful APIs
- ✅ Working with databases
- ✅ Implementing authentication/authorization
- ✅ Data validation
- ✅ Error handling
- ✅ Code organization
- ✅ Professional development practices

**Remember**:

- Take your time
- Test thoroughly
- Ask questions when stuck
- Follow the patterns shown
- Write clean code

**Good luck! You've got this! 🚀**

---

## 📞 Support

If you need help:

- **Email**: [instructor-email]
- **Discord/Slack**: [channel-name]
- **Office Hours**: [schedule]

---

**Document Version**: 1.0  
**Last Updated**: February 6, 2026  
**Assignment Number**: Task Assignment #1  
**Course**: Backend Development - Healthcare System
