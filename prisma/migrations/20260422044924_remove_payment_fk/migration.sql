-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "referenceId" TEXT,
    "customerName" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'pix',
    "dueDate" TEXT,
    "paymentDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "origin" TEXT NOT NULL DEFAULT 'academia',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Payment" ("createdAt", "customerName", "dueDate", "id", "notes", "origin", "paymentDate", "paymentMethod", "referenceId", "status", "type", "updatedAt", "value") SELECT "createdAt", "customerName", "dueDate", "id", "notes", "origin", "paymentDate", "paymentMethod", "referenceId", "status", "type", "updatedAt", "value" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
