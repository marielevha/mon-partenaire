-- Create table for project documents if it does not exist
create table if not exists "ProjectDocument" (
  "id" text primary key,
  "projectId" text not null references "Project"("id") on delete cascade on update cascade,
  "storagePath" text not null unique,
  "originalName" text not null,
  "mimeType" text,
  "sizeBytes" integer,
  "sortOrder" integer not null default 0,
  "createdAt" timestamp(3) not null default current_timestamp
);

create index if not exists "ProjectDocument_projectId_sortOrder_idx"
  on "ProjectDocument" ("projectId", "sortOrder");
