/*
  Warnings:

  - Added the required column `domain` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_date` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `milestones` ADD COLUMN `completion_percentage` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `mentor_feedback` TEXT NULL;

-- AlterTable
ALTER TABLE `projects` ADD COLUMN `domain` VARCHAR(200) NOT NULL,
    ADD COLUMN `end_date` DATE NOT NULL,
    ADD COLUMN `start_date` DATE NOT NULL;
