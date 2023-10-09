-- CreateTable
CREATE TABLE "ScrapingRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "urlFrom" TEXT NOT NULL,
    "urlFinal" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
