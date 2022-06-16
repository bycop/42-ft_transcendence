CREATE TABLE "user" (
  "id" SERIAL PRIMARY KEY,
  "username" varchar UNIQUE NOT NULL,
  "login42" varchar UNIQUE NOT NULL,
  "avatar" varchar NULL,
  "ladder" float8 DEFAULT 0.0,
  "created_at" timestamp NOT NULL,
  "doublefa" bool DEFAULT false,
  "secretCode" varchar DEFAULT NULL,
  "last_alive" timestamp NULL
);

CREATE TABLE "invite" (
  "id" SERIAL PRIMARY KEY,
  "user_1" int NOT NULL,
  "user_2" int NOT NULL,
  "is_classic" bool DEFAULT true,
  "declined" boolean DEFAULT false,
  "accepted" boolean DEFAULT false
);

CREATE TABLE "session" (
  "sid" varchar PRIMARY KEY,
  "user_id" int NOT NULL,
  "expired" timestamp NOT NULL
);

CREATE TABLE "message" (
  "id" SERIAL PRIMARY KEY,
  "text" varchar NOT NULL,
  "creator_id" int NOT NULL,
  "target_id" int NOT NULL,
  "is_channel" bool NOT NULL,
  "is_system" bool NOT NULL,
  "created_at" timestamp NOT NULL
);

CREATE TABLE "history_game" (
  "id" SERIAL PRIMARY KEY,
  "game_id" varchar,
  "user_1" int NOT NULL,
  "user_2" int NOT NULL,
  "score_1" int NOT NULL,
  "score_2" int NOT NULL,
  "port" int NOT NULL,
  "is_classic" bool DEFAULT true,
  "created_at" timestamp NOT NULL,
  "end_at" timestamp
);

CREATE TABLE "channel" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL,
  "type" int NOT NULL,
  "password" varchar DEFAULT null,
  "avatar" varchar NULL,
  "created_at" timestamp NOT NULL
);

CREATE TABLE "channel_user" (
  "id" SERIAL PRIMARY KEY,
  "channel_id" int NOT NULL,
  "user_id" int NOT NULL,
  "role_id" int NULL,
  "created_at" timestamp NOT NULL
);

CREATE TABLE "role" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL
);

CREATE TABLE "type_of_channel" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL
);

CREATE TABLE "sanction" (
  "id" SERIAL PRIMARY KEY,
  "type_of_sanction" int NOT NULL,
  "moderator_id" int NOT NULL,
  "user_id" int,
  "channel_id" int,
  "created_at" timestamp NOT NULL,
  "end_at" timestamp NULL
);

CREATE TABLE "type_of_sanction" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL
);

CREATE TABLE "relations_user" (
  "id" SERIAL PRIMARY KEY,
  "user_1" int NOT NULL,
  "user_2" int NOT NULL,
  "type_of_relation" int NOT NULL,
  "block_src" int NULL,
  "created_at" timestamp NOT NULL
);

CREATE TABLE "type_of_relation" (
  "id" SERIAL PRIMARY KEY,
  "name" varchar NOT NULL
);

CREATE TABLE "achievement" (
  "id" SERIAL PRIMARY KEY,
  "title" varchar NOT NULL,
  "text" text NOT NULL,
  "trophy" text NOT NULL,
  "created_at" timestamp NOT NULL
);

CREATE TABLE "achievement_by_user" (
  "id" SERIAL PRIMARY KEY,
  "user_id" int NOT NULL,
  "achievement_id" int NOT NULL,
  "created_at" timestamp NOT NULL
);

ALTER TABLE "session" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "invite" ADD FOREIGN KEY ("user_1") REFERENCES "user" ("id");
ALTER TABLE "invite" ADD FOREIGN KEY ("user_2") REFERENCES "user" ("id");

ALTER TABLE "message" ADD FOREIGN KEY ("creator_id") REFERENCES "user" ("id");

-- ALTER TABLE "message" ADD FOREIGN KEY ("target_id") REFERENCES "user" ("id");

-- ALTER TABLE "message" ADD FOREIGN KEY ("target_id") REFERENCES "channel" ("id");

ALTER TABLE "history_game" ADD FOREIGN KEY ("user_1") REFERENCES "user" ("id");

ALTER TABLE "history_game" ADD FOREIGN KEY ("user_2") REFERENCES "user" ("id");

ALTER TABLE "channel" ADD FOREIGN KEY ("type") REFERENCES "type_of_channel" ("id");

ALTER TABLE "channel_user" ADD FOREIGN KEY ("channel_id") REFERENCES "channel" ("id");

ALTER TABLE "channel_user" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "channel_user" ADD FOREIGN KEY ("role_id") REFERENCES "role" ("id");

ALTER TABLE "sanction" ADD FOREIGN KEY ("type_of_sanction") REFERENCES "type_of_sanction" ("id");

ALTER TABLE "sanction" ADD FOREIGN KEY ("moderator_id") REFERENCES "user" ("id");

ALTER TABLE "sanction" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "sanction" ADD FOREIGN KEY ("channel_id") REFERENCES "channel" ("id");

ALTER TABLE "relations_user" ADD FOREIGN KEY ("user_1") REFERENCES "user" ("id");

ALTER TABLE "relations_user" ADD FOREIGN KEY ("user_2") REFERENCES "user" ("id");

ALTER TABLE "relations_user" ADD FOREIGN KEY ("type_of_relation") REFERENCES "type_of_relation" ("id");

ALTER TABLE "achievement_by_user" ADD FOREIGN KEY ("user_id") REFERENCES "user" ("id");

ALTER TABLE "achievement_by_user" ADD FOREIGN KEY ("achievement_id") REFERENCES "achievement" ("id");

INSERT INTO "type_of_relation" ("id", "name") VALUES (1, 'friend'), (2, 'block');

INSERT INTO "type_of_channel" ("id", "name") VALUES (1, 'public'), (2, 'private'), (3, 'protected');

INSERT INTO "type_of_sanction" ("id", "name") VALUES (1, 'ban'), (2, 'mute');

INSERT INTO "role" ("id", "name") VALUES (1, 'admin'), (2, 'owner');

INSERT INTO "achievement" ("id", "title", "text", "trophy", "created_at" ) VALUES (1, 'Golden Ball', 'Score 50 balls', 'bronze', current_timestamp), (2, 'Loving Social Media', 'Have 10 friends', 'bronze', current_timestamp),  (3, 'Mud ball', 'Conceded 50 goals', 'bronze', current_timestamp), (4, 'I love pong', 'Play 10 games', 'silver', current_timestamp), (5, 'Pro gamer', 'Become level 5', 'silver', current_timestamp ), (6, 'Golden trophy', 'Complete all other achievements to have the golden trophy', 'golden', current_timestamp);


-- INSERT INTO "user" ("username", "created_at") VALUES ('sfournio', '2019-01-01 00:00:00'), ('ccoto', '2019-01-01 00:00:00');