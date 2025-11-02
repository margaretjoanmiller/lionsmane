-- Custom SQL migration file, put your code below! --

ALTER TABLE "feeds" DROP COLUMN "last_modified_header";
ALTER TABLE "feeds" DROP COLUMN "etag_header";
