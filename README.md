# backend-dojangms
Framework Express js untuk backend dojangms

// DB Diagram
Table users {
  id bigint [pk]
  name varchar
  email varchar [unique]
  password varchar
  birth_year int
  status enum('active', 'inactive')
  created_at timestamp
  updated_at timestamp
}

Table roles {
  id int [pk]
  name varchar [unique]
}

Table user_roles {
  user_id bigint [ref: > users.id]
  role_id int [ref: > roles.id]

  indexes {
    (user_id, role_id) [pk]
  }
}

Table belts {
  id int [pk]
  name varchar
  dan_level int
  order_level int
}

Table user_belts {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  belt_id int [ref: > belts.id]
  is_current boolean
  achieved_at date
}

Table championships {
  id bigint [pk]
  name varchar
  level enum('kota', 'provinsi', 'nasional', 'internasional')
  location varchar
  year int
  start_date date
  end_date date
}

Table age_classes {
  id int [pk]
  name varchar    // pra-cadet, cadet, junior, senior
  min_age int
  max_age int     // nullable untuk senior
}

Table competition_types {
  id int [pk]
  code enum('kyorugi', 'poomsae')
}

Table competition_levels {
  id int [pk]
  name enum('festival', 'pemula', 'prestasi')
}

Table competition_classes {
  id int [pk]

  competition_type_id int [ref: > competition_types.id]
  age_class_id int [ref: > age_classes.id]
  competition_level_id int [ref: > competition_levels.id]

  gender enum('putra', 'putri', 'campuran')

  // Kyorugi
  min_weight float
  max_weight float

  // Poomsae
  poomsae_type varchar  // taeguk 3, taebek, koryo, freestyle
}

Table championship_classes {
  id int [pk]
  championship_id bigint [ref: > championships.id]
  competition_class_id int [ref: > competition_classes.id]
}

Table championship_participants {
  id bigint [pk]
  championship_id bigint [ref: > championships.id]
  user_id bigint [ref: > users.id]
  belt_id int [ref: > belts.id]
  competition_class_id int [ref: > competition_classes.id]
}


cd /path/to/backend
git config user.name "Nama Akun 2"
git config user.email "email-akun2@example.com"

feat: Menambahkan fitur baru

Contoh: feat: add user login functionality

fix: Memperbaiki bug

Contoh: fix: resolve null pointer exception in payment module

docs: Perubahan dokumentasi saja

Contoh: docs: update API documentation for user endpoints

style: Perubahan format kode (whitespace, formatting, semicolon, dll) tanpa mengubah logika

Contoh: style: format code with prettier

refactor: Refactoring kode tanpa mengubah fungsionalitas

Contoh: refactor: simplify authentication logic

perf: Peningkatan performa

Contoh: perf: optimize database queries in user service

test: Menambahkan atau memperbaiki test

Contoh: test: add unit tests for calculator module

build: Perubahan pada build system atau dependencies

Contoh: build: upgrade react to version 18

ci: Perubahan pada CI/CD configuration

Contoh: ci: add automated deployment to staging

chore: Tugas maintenance lainnya

Contoh: chore: update gitignore file

revert: Membatalkan commit sebelumnya

Contoh: revert: revert "feat: add experimental feature"