-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "StockLogType" AS ENUM ('PURCHASE', 'USAGE', 'ADJUSTMENT', 'WASTE', 'RETURN');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('DINE_IN', 'TAKEAWAY', 'DELIVERY', 'DRIVE_THRU');

-- CreateEnum
CREATE TYPE "QueueStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PreparationStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'WAITING_CHECK', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "RecipeComplexity" AS ENUM ('SIMPLE', 'MEDIUM', 'COMPLEX', 'EXPERT');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('EMAIL', 'SMS', 'PUSH_NOTIFICATION', 'SOCIAL_MEDIA', 'IN_APP', 'PRINT');

-- CreateEnum
CREATE TYPE "TargetAudience" AS ENUM ('ALL_CUSTOMERS', 'NEW_CUSTOMERS', 'RETURNING_CUSTOMERS', 'VIP_CUSTOMERS', 'INACTIVE_CUSTOMERS', 'BIRTHDAY_SPECIAL');

-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('DISCOUNT', 'BOGO', 'BUNDLE', 'HAPPY_HOUR', 'FLASH_SALE', 'LOYALTY_REWARD');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_ITEM', 'FREE_DELIVERY');

-- CreateEnum
CREATE TYPE "HappyHourTarget" AS ENUM ('ALL_ITEMS', 'BEVERAGES', 'FOOD', 'DESSERTS', 'SPECIFIC_ITEMS');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT', 'SPECIAL_EVENT');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "BreakType" AS ENUM ('LUNCH', 'DINNER', 'REST', 'COFFEE', 'CIGARETTE', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'TEMPORARY', 'SEASONAL', 'INTERN', 'STUDENT');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('KITCHEN', 'SERVICE', 'BAR', 'DELIVERY', 'MANAGEMENT', 'CLEANING', 'SECURITY', 'MAINTENANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'WORK_PERMIT', 'FOOD_SAFETY_CERT', 'CONTRACT', 'INSURANCE', 'TAX_FORM', 'OTHER');

-- CreateEnum
CREATE TYPE "TimeOffType" AS ENUM ('VACATION', 'SICK_LEAVE', 'PERSONAL', 'UNPAID', 'PARENTAL', 'OTHER');

-- CreateEnum
CREATE TYPE "TimeOffStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'APPLE_PAY', 'GOOGLE_PAY', 'BITCOIN', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('SALES', 'STAFF_PERFORMANCE', 'TABLE_UTILIZATION', 'INVENTORY', 'CUSTOMER_ANALYTICS', 'FINANCIAL', 'OPERATIONAL');

-- CreateEnum
CREATE TYPE "ReportFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ORDER_STATUS', 'RESERVATION_REMINDER', 'DELIVERY_UPDATE', 'PAYMENT_CONFIRMATION', 'STAFF_SCHEDULE', 'INVENTORY_ALERT', 'CUSTOMER_SUPPORT', 'MARKETING', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'SMS', 'PUSH', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'DELIVERED', 'READ');

-- CreateEnum
CREATE TYPE "RecipientType" AS ENUM ('CUSTOMER', 'EMPLOYEE');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "vatNumber" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "businessHours" JSONB NOT NULL,
    "specialHours" JSONB,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Brussels',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "supportedLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "allowReservations" BOOLEAN NOT NULL DEFAULT true,
    "allowDelivery" BOOLEAN NOT NULL DEFAULT true,
    "allowTakeaway" BOOLEAN NOT NULL DEFAULT true,
    "allowPickup" BOOLEAN NOT NULL DEFAULT true,
    "allowDineIn" BOOLEAN NOT NULL DEFAULT true,
    "allowDriveThru" BOOLEAN NOT NULL DEFAULT false,
    "deliveryRadius" DOUBLE PRECISION,
    "deliveryTimeRadius" INTEGER,
    "minimumOrderAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deliveryFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "freeDeliveryThreshold" DECIMAL(10,2),
    "totalTables" INTEGER NOT NULL DEFAULT 0,
    "averageSeatingTime" INTEGER NOT NULL DEFAULT 60,
    "maxReservationSize" INTEGER NOT NULL DEFAULT 10,
    "requireReservationDeposit" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DECIMAL(10,2),
    "autoAcceptOrders" BOOLEAN NOT NULL DEFAULT false,
    "preparationTimeDefault" INTEGER NOT NULL DEFAULT 20,
    "allowSpecialInstructions" BOOLEAN NOT NULL DEFAULT true,
    "maxItemsPerOrder" INTEGER,
    "acceptedPaymentMethods" "PaymentMethod"[],
    "defaultTaxRate" DECIMAL(5,2) NOT NULL DEFAULT 21,
    "serviceFeePercentage" DECIMAL(5,2),
    "loyaltyProgramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pointsPerCurrency" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "minimumPointsRedeem" INTEGER NOT NULL DEFAULT 100,
    "pointsValueInCurrency" DECIMAL(10,2) NOT NULL DEFAULT 0.01,
    "customerSupportEmail" TEXT,
    "customerSupportPhone" TEXT,
    "emergencyContact" TEXT,
    "socialLinks" JSONB,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT false,
    "smsNotifications" BOOLEAN NOT NULL DEFAULT false,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT false,
    "automaticTableAssignment" BOOLEAN NOT NULL DEFAULT true,
    "automaticShiftScheduling" BOOLEAN NOT NULL DEFAULT false,
    "requireStaffClockIn" BOOLEAN NOT NULL DEFAULT true,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "autoReorderEnabled" BOOLEAN NOT NULL DEFAULT false,
    "inventoryAlerts" BOOLEAN NOT NULL DEFAULT true,
    "defaultShiftDuration" INTEGER NOT NULL DEFAULT 8,
    "minimumBreakTime" INTEGER NOT NULL DEFAULT 30,
    "maxOvertimeHours" INTEGER NOT NULL DEFAULT 4,
    "coursePacing" INTEGER NOT NULL DEFAULT 15,
    "maxSimultaneousOrders" INTEGER NOT NULL DEFAULT 20,
    "requireAllergenyInfo" BOOLEAN NOT NULL DEFAULT true,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tax_configurations" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "appliesTo" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minimumOrder" DECIMAL(10,2) NOT NULL,
    "deliveryFee" DECIMAL(10,2) NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    "polygonPoints" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "password" TEXT,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "avgOrderValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "language" TEXT DEFAULT 'en',
    "birthDate" TIMESTAMP(3),
    "notes" TEXT,
    "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
    "preferences" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customizations" JSONB,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "extraPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "houseNumber" TEXT NOT NULL,
    "boxNumber" TEXT,
    "streetName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "deliveryNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" "Gender",
    "employmentType" "EmploymentType" NOT NULL DEFAULT 'FULL_TIME',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "department" "Department"[] DEFAULT ARRAY[]::"Department"[],
    "hourlyRate" DECIMAL(10,2) NOT NULL,
    "bankAccount" TEXT,
    "maxHoursPerWeek" INTEGER NOT NULL DEFAULT 40,
    "unavailableDays" "Weekday"[],
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_documents" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "DocumentType" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "certificateNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_roles" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "performance_reviews" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeoffs" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "TimeOffType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "TimeOffStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeoffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breaks" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "type" "BreakType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "shiftType" "ShiftType" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'SCHEDULED',
    "minimumStaff" INTEGER NOT NULL DEFAULT 1,
    "maximumStaff" INTEGER,
    "department" "Department"[],
    "notes" TEXT,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "isSpecialEvent" BOOLEAN NOT NULL DEFAULT false,
    "eventDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_sections" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_tasks" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_assignments" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" "Department" NOT NULL,
    "isSupervisor" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "actualStartTime" TIMESTAMP(3),
    "actualEndTime" TIMESTAMP(3),
    "status" "AssignmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isLate" BOOLEAN NOT NULL DEFAULT false,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "overtime" INTEGER NOT NULL DEFAULT 0,
    "isCovered" BOOLEAN NOT NULL DEFAULT false,
    "coveredById" TEXT,
    "coverReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_breaks" (
    "id" TEXT NOT NULL,
    "shiftAssignmentId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "breakType" "BreakType" NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_breaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actual_breaks" (
    "id" TEXT NOT NULL,
    "shiftAssignmentId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "breakType" "BreakType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actual_breaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "image" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "preparationTime" INTEGER NOT NULL DEFAULT 15,
    "allergens" TEXT[],
    "nutritionalInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_ingredients" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stock" DECIMAL(10,3) NOT NULL,
    "unit" TEXT NOT NULL,
    "reorderPoint" DECIMAL(10,3) NOT NULL,
    "cost" DECIMAL(10,2) NOT NULL,
    "supplierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredient_stock_logs" (
    "id" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "quantity" DECIMAL(10,3) NOT NULL,
    "type" "StockLogType" NOT NULL,
    "reason" TEXT,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingredient_stock_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "OrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "deliveryFee" DECIMAL(10,2),
    "tableId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "specialRequests" TEXT,
    "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel"[],
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "variables" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "recipientType" "RecipientType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL,
    "content" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "departments" "Department"[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_acknowledgments" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_acknowledgments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalRevenue" DECIMAL(10,2) NOT NULL,
    "totalOrders" INTEGER NOT NULL,
    "avgOrderValue" DECIMAL(10,2) NOT NULL,
    "dineInRevenue" DECIMAL(10,2) NOT NULL,
    "takeawayRevenue" DECIMAL(10,2) NOT NULL,
    "deliveryRevenue" DECIMAL(10,2) NOT NULL,
    "cashPayments" DECIMAL(10,2) NOT NULL,
    "cardPayments" DECIMAL(10,2) NOT NULL,
    "otherPayments" DECIMAL(10,2) NOT NULL,
    "peakHourOrders" JSONB NOT NULL,
    "topProducts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_metrics" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "ordersHandled" INTEGER NOT NULL DEFAULT 0,
    "tablesServed" INTEGER NOT NULL DEFAULT 0,
    "avgServiceTime" INTEGER NOT NULL DEFAULT 0,
    "hoursWorked" DECIMAL(5,2) NOT NULL,
    "overtimeHours" DECIMAL(5,2) NOT NULL,
    "breaksTime" INTEGER NOT NULL DEFAULT 0,
    "customerRating" DECIMAL(3,2),
    "speedOfService" DECIMAL(3,2),
    "accuracy" DECIMAL(3,2),
    "dishesCompleted" INTEGER,
    "avgPreparationTime" INTEGER,
    "qualityRating" DECIMAL(3,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "newCustomers" INTEGER NOT NULL,
    "returningCustomers" INTEGER NOT NULL,
    "totalActiveCustomers" INTEGER NOT NULL,
    "avgOrdersPerCustomer" DECIMAL(5,2) NOT NULL,
    "avgSpendPerCustomer" DECIMAL(10,2) NOT NULL,
    "loyaltyProgramSignups" INTEGER NOT NULL,
    "pointsIssued" INTEGER NOT NULL,
    "pointsRedeemed" INTEGER NOT NULL,
    "reservationRate" DECIMAL(5,2) NOT NULL,
    "cancellationRate" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_metrics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "lowStockItems" INTEGER NOT NULL,
    "outOfStockItems" INTEGER NOT NULL,
    "totalInventoryValue" DECIMAL(10,2) NOT NULL,
    "inventoryCost" DECIMAL(10,2) NOT NULL,
    "wasteValue" DECIMAL(10,2) NOT NULL,
    "topUsedItems" JSONB NOT NULL,
    "wastageItems" JSONB NOT NULL,
    "supplierPerformance" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" "ReportType" NOT NULL,
    "frequency" "ReportFrequency" NOT NULL,
    "recipients" TEXT[],
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "type" "CampaignType" NOT NULL,
    "targetAudience" "TargetAudience"[],
    "minSpent" DECIMAL(10,2),
    "minOrders" INTEGER,
    "budget" DECIMAL(10,2) NOT NULL,
    "totalSpent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "PromotionType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "daysOfWeek" "Weekday"[],
    "startTime" TEXT,
    "endTime" TEXT,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minOrderAmount" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "usageLimit" INTEGER,
    "userLimit" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "applicableItems" TEXT[],
    "excludedItems" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "campaignId" TEXT,
    "promotionId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "maxUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "happy_hours" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "daysOfWeek" "Weekday"[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "appliesTo" "HappyHourTarget"[],
    "excludedItems" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "happy_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_usage" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "discountCodeId" TEXT,
    "orderId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitchen_stations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxCapacity" INTEGER NOT NULL,
    "currentLoad" INTEGER NOT NULL DEFAULT 0,
    "itemTypes" TEXT[],
    "equipment" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitchen_stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitchen_staff_assignments" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "isLeader" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitchen_staff_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitchen_queues" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "status" "QueueStatus" NOT NULL DEFAULT 'ACTIVE',
    "priorityLevel" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "estimatedCompletionTime" TIMESTAMP(3),
    "actualCompletionTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitchen_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kitchen_order_items" (
    "id" TEXT NOT NULL,
    "queueId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "status" "PreparationStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "recipeVersion" TEXT,
    "specialInstructions" TEXT,
    "allergenAlert" BOOLEAN NOT NULL DEFAULT false,
    "checkedBy" TEXT,
    "qualityIssues" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kitchen_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_lines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_steps" (
    "id" TEXT NOT NULL,
    "productionLineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "isParallel" BOOLEAN NOT NULL DEFAULT false,
    "requireAllComplete" BOOLEAN NOT NULL DEFAULT true,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "estimatedTime" INTEGER,
    "alertAfter" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "station_steps" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "station_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_progress" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "currentStepId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "step_progress" (
    "id" TEXT NOT NULL,
    "orderProgressId" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'PENDING',
    "assignedTo" TEXT,
    "startTime" TIMESTAMP(3),
    "completionTime" TIMESTAMP(3),
    "checkedBy" TEXT,
    "qualityNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "step_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CategoryToPrepare" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToPrepare_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_verificationToken_key" ON "customers"("verificationToken");

-- CreateIndex
CREATE UNIQUE INDEX "customers_resetPasswordToken_key" ON "customers"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "cart_items_cartId_idx" ON "cart_items"("cartId");

-- CreateIndex
CREATE INDEX "cart_items_productId_idx" ON "cart_items"("productId");

-- CreateIndex
CREATE INDEX "customer_addresses_customerId_idx" ON "customer_addresses"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_phone_key" ON "employees"("phone");

-- CreateIndex
CREATE INDEX "employees_email_idx" ON "employees"("email");

-- CreateIndex
CREATE INDEX "employees_status_idx" ON "employees"("status");

-- CreateIndex
CREATE INDEX "employees_department_idx" ON "employees"("department");

-- CreateIndex
CREATE INDEX "shifts_startTime_endTime_idx" ON "shifts"("startTime", "endTime");

-- CreateIndex
CREATE INDEX "shifts_status_idx" ON "shifts"("status");

-- CreateIndex
CREATE INDEX "shift_sections_shiftId_idx" ON "shift_sections"("shiftId");

-- CreateIndex
CREATE INDEX "shift_tasks_shiftId_idx" ON "shift_tasks"("shiftId");

-- CreateIndex
CREATE INDEX "shift_tasks_status_idx" ON "shift_tasks"("status");

-- CreateIndex
CREATE INDEX "shift_assignments_shiftId_idx" ON "shift_assignments"("shiftId");

-- CreateIndex
CREATE INDEX "shift_assignments_employeeId_idx" ON "shift_assignments"("employeeId");

-- CreateIndex
CREATE INDEX "shift_assignments_status_idx" ON "shift_assignments"("status");

-- CreateIndex
CREATE INDEX "scheduled_breaks_shiftAssignmentId_idx" ON "scheduled_breaks"("shiftAssignmentId");

-- CreateIndex
CREATE INDEX "actual_breaks_shiftAssignmentId_idx" ON "actual_breaks"("shiftAssignmentId");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_isAvailable_idx" ON "products"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "notifications_recipientId_recipientType_idx" ON "notifications"("recipientId", "recipientType");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "announcements_priority_idx" ON "announcements"("priority");

-- CreateIndex
CREATE INDEX "announcements_startDate_endDate_idx" ON "announcements"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_acknowledgments_announcementId_employeeId_key" ON "announcement_acknowledgments"("announcementId", "employeeId");

-- CreateIndex
CREATE INDEX "sales_metrics_date_idx" ON "sales_metrics"("date");

-- CreateIndex
CREATE INDEX "staff_metrics_employeeId_date_idx" ON "staff_metrics"("employeeId", "date");

-- CreateIndex
CREATE INDEX "customer_metrics_date_idx" ON "customer_metrics"("date");

-- CreateIndex
CREATE INDEX "inventory_metrics_date_idx" ON "inventory_metrics"("date");

-- CreateIndex
CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

-- CreateIndex
CREATE INDEX "campaigns_startDate_endDate_idx" ON "campaigns"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "promotions_startDate_endDate_idx" ON "promotions"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_code_idx" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "promotion_usage_promotionId_idx" ON "promotion_usage"("promotionId");

-- CreateIndex
CREATE INDEX "promotion_usage_customerId_idx" ON "promotion_usage"("customerId");

-- CreateIndex
CREATE INDEX "kitchen_staff_assignments_stationId_idx" ON "kitchen_staff_assignments"("stationId");

-- CreateIndex
CREATE INDEX "kitchen_queues_stationId_idx" ON "kitchen_queues"("stationId");

-- CreateIndex
CREATE INDEX "kitchen_order_items_queueId_idx" ON "kitchen_order_items"("queueId");

-- CreateIndex
CREATE INDEX "kitchen_order_items_status_idx" ON "kitchen_order_items"("status");

-- CreateIndex
CREATE UNIQUE INDEX "production_steps_productionLineId_stepOrder_key" ON "production_steps"("productionLineId", "stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "station_steps_stepId_stationId_key" ON "station_steps"("stepId", "stationId");

-- CreateIndex
CREATE UNIQUE INDEX "order_progress_orderId_key" ON "order_progress"("orderId");

-- CreateIndex
CREATE INDEX "_CategoryToPrepare_B_index" ON "_CategoryToPrepare"("B");

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_documents" ADD CONSTRAINT "employee_documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_roles" ADD CONSTRAINT "employee_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeoffs" ADD CONSTRAINT "timeoffs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "breaks" ADD CONSTRAINT "breaks_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_sections" ADD CONSTRAINT "shift_sections_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_tasks" ADD CONSTRAINT "shift_tasks_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_breaks" ADD CONSTRAINT "scheduled_breaks_shiftAssignmentId_fkey" FOREIGN KEY ("shiftAssignmentId") REFERENCES "shift_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actual_breaks" ADD CONSTRAINT "actual_breaks_shiftAssignmentId_fkey" FOREIGN KEY ("shiftAssignmentId") REFERENCES "shift_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_ingredients" ADD CONSTRAINT "product_ingredients_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingredient_stock_logs" ADD CONSTRAINT "ingredient_stock_logs_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "notification_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_acknowledgments" ADD CONSTRAINT "announcement_acknowledgments_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_usage" ADD CONSTRAINT "promotion_usage_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitchen_staff_assignments" ADD CONSTRAINT "kitchen_staff_assignments_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "kitchen_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitchen_queues" ADD CONSTRAINT "kitchen_queues_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "kitchen_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kitchen_order_items" ADD CONSTRAINT "kitchen_order_items_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "kitchen_queues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_steps" ADD CONSTRAINT "production_steps_productionLineId_fkey" FOREIGN KEY ("productionLineId") REFERENCES "production_lines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_steps" ADD CONSTRAINT "station_steps_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "production_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "station_steps" ADD CONSTRAINT "station_steps_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "kitchen_stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "step_progress" ADD CONSTRAINT "step_progress_orderProgressId_fkey" FOREIGN KEY ("orderProgressId") REFERENCES "order_progress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPrepare" ADD CONSTRAINT "_CategoryToPrepare_A_fkey" FOREIGN KEY ("A") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToPrepare" ADD CONSTRAINT "_CategoryToPrepare_B_fkey" FOREIGN KEY ("B") REFERENCES "production_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
