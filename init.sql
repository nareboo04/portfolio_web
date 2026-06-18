-- Portfolio Database Schema
-- MySQL 8.0

CREATE DATABASE IF NOT EXISTS `portfolio` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `portfolio`;

-- ─────────────────────────────────────────────
-- Site content (hero, about, meta)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `site_content` (
  `key` VARCHAR(100) NOT NULL,
  `value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_content` (`key`, `value`) VALUES
  ('hero_name',        'Your Name'),
  ('hero_subtitle',    'Full-Stack Developer|Open Source Enthusiast|Problem Solver'),
  ('hero_description', 'I build performant, accessible, and beautiful web applications.'),
  ('about_bio',        'I am a passionate developer with a love for clean code and great UX. I thrive at the intersection of design and engineering, crafting experiences that are both delightful and robust.'),
  ('about_location',   'San Francisco, CA'),
  ('about_email',      'hello@example.com'),
  ('about_github',     'https://github.com/yourusername'),
  ('about_linkedin',   'https://linkedin.com/in/yourusername'),
  ('about_resume_url', '/resume.pdf'),
  ('meta_title',       'Your Name — Portfolio'),
  ('meta_description', 'Personal portfolio of Your Name, a full-stack developer.'),
  ('skills_label',              'What I Work With'),
  ('skills_heading',            'Skills & Technologies'),
  ('skills_subheading',         'A curated list of tools and technologies I use to bring ideas to life.'),
  ('timeline_label',            'My Journey'),
  ('timeline_heading',          'Experience & Education'),
  ('timeline_subheading',       'The milestones that shaped my career.'),
  ('projects_label',            'What I''ve Built'),
  ('projects_heading',          'Projects'),
  ('projects_subheading',       'A selection of projects I''ve worked on.'),
  ('certifications_label',      'What I''ve Earned'),
  ('certifications_heading',    'Certifications & Achievements'),
  ('certifications_subheading', 'Certifications and credentials I''ve obtained.'),
  ('activities_label',          'Beyond the Code'),
  ('activities_heading',        'Activities'),
  ('activities_subheading',     'Volunteering, awards, publications, and other activities.'),
  ('contact_label',             'Get In Touch'),
  ('contact_heading',           'Contact Me'),
  ('contact_subheading',        'Have a project in mind or just want to say hello? I''d love to hear from you.'),
  ('lab_label',                 'My Setup'),
  ('lab_heading',               'Infrastructure & Lab'),
  ('lab_subheading',            'The tools, hardware, and platforms that power my work.'),
  ('section_order',             'about,certifications,infrastructure,projects,skills,timeline,activities,contact')
ON DUPLICATE KEY UPDATE `key` = `key`;

-- ─────────────────────────────────────────────
-- Skills
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `skills` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(100) NOT NULL,
  `category`    ENUM('frontend','backend','database','devops','other') NOT NULL DEFAULT 'other',
  `level`       TINYINT UNSIGNED NOT NULL DEFAULT 80 COMMENT '0-100 proficiency',
  `sort_order`  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `icon_url`    VARCHAR(500) DEFAULT NULL,
  `description` TEXT DEFAULT NULL,
  `status`      ENUM('public','draft','private') NOT NULL DEFAULT 'public'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `skills` (`name`, `category`, `level`, `sort_order`) VALUES
  ('Next.js',       'frontend', 95, 1),
  ('React',         'frontend', 95, 2),
  ('TypeScript',    'frontend', 90, 3),
  ('Tailwind CSS',  'frontend', 90, 4),
  ('Node.js',       'backend',  90, 5),
  ('Express',       'backend',  85, 6),
  ('MySQL',         'database', 85, 7),
  ('Redis',         'database', 75, 8),
  ('Docker',        'devops',   85, 9),
  ('Git',           'devops',   90, 10);

-- ─────────────────────────────────────────────
-- Timeline (experience / education)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `timeline` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `type`        ENUM('experience','education') NOT NULL DEFAULT 'experience',
  `title`       VARCHAR(200) NOT NULL,
  `organization`VARCHAR(200) NOT NULL,
  `location`    VARCHAR(200),
  `start_date`  DATE NOT NULL,
  `end_date`    DATE,
  `current`     TINYINT(1) NOT NULL DEFAULT 0,
  `description` TEXT,
  `pdf_url`     VARCHAR(500) NULL,
  `sort_order`  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `status`      ENUM('public','draft','private') NOT NULL DEFAULT 'public'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `timeline` (`type`, `title`, `organization`, `location`, `start_date`, `end_date`, `current`, `description`, `sort_order`) VALUES
  ('experience', 'Senior Full-Stack Developer', 'Acme Corp',       'Remote',       '2022-01-01', NULL,         1, 'Led a team of 4 engineers to ship a SaaS platform serving 50k users.', 1),
  ('experience', 'Frontend Developer',          'Startup XYZ',     'New York, NY', '2020-06-01', '2021-12-31', 0, 'Built a React component library adopted across 3 product teams.',       2),
  ('education',  'B.Sc. Computer Science',      'State University', 'Boston, MA',  '2016-09-01', '2020-05-31', 0, 'Graduated with honours. Focus on distributed systems.',                3);

-- ─────────────────────────────────────────────
-- Projects
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `projects` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`        VARCHAR(200) NOT NULL,
  `slug`         VARCHAR(220) NOT NULL UNIQUE,
  `summary`      VARCHAR(500) NOT NULL,
  `description`  TEXT,
  `category`     VARCHAR(100) NOT NULL DEFAULT 'web',
  `tags`         JSON,
  `images`       JSON COMMENT 'Array of public paths',
  `live_url`     VARCHAR(500),
  `repo_url`     VARCHAR(500),
  `featured`     TINYINT(1) NOT NULL DEFAULT 0,
  `pdf_url`      VARCHAR(500) NULL,
  `status`       ENUM('public','draft','private') NOT NULL DEFAULT 'public',
  `sort_order`   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `projects` (`title`, `slug`, `summary`, `description`, `category`, `tags`, `images`, `live_url`, `repo_url`, `featured`, `sort_order`) VALUES
  (
    'Portfolio Website',
    'portfolio-website',
    'This very portfolio — built with Next.js, Tailwind CSS, MySQL, and Docker.',
    'A fully containerised personal portfolio with inline admin editing, project CRUD, Cloudflare Turnstile spam protection, and a message centre.',
    'web',
    '["Next.js","Tailwind CSS","MySQL","Docker","TypeScript"]',
    '[]',
    NULL,
    'https://github.com/yourusername/portfolio',
    1,
    1
  );

-- ─────────────────────────────────────────────
-- Contact messages
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `messages` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`       VARCHAR(200) NOT NULL,
  `email`      VARCHAR(320) NOT NULL,
  `subject`    VARCHAR(300) NOT NULL,
  `body`       TEXT NOT NULL,
  `read`       TINYINT(1) NOT NULL DEFAULT 0,
  `ip`         VARCHAR(45),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- Certifications / Achievements
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `certifications` (
  `id`             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `title`          VARCHAR(200) NOT NULL,
  `issuer`         VARCHAR(200) NOT NULL,
  `issue_date`     DATE NOT NULL,
  `expiry_date`    DATE NULL,
  `description`    TEXT NULL,
  `credential_url` VARCHAR(500) NULL,
  `pdf_url`        VARCHAR(500) NULL,
  `image_url`      VARCHAR(500) NULL,
  `sort_order`     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status`         ENUM('public','draft','private') NOT NULL DEFAULT 'public'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- Activities
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `activities` (
  `id`           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `type`         ENUM('volunteer','award','publication','project','other') NOT NULL DEFAULT 'other',
  `title`        VARCHAR(200) NOT NULL,
  `organization` VARCHAR(200) NULL,
  `description`  TEXT NULL,
  `date`         DATE NULL,
  `url`          VARCHAR(500) NULL,
  `image_url`    VARCHAR(500) NULL,
  `sort_order`   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status`       ENUM('public','draft','private') NOT NULL DEFAULT 'public'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────
-- Infrastructure / Lab
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lab_sections` (
  `id`          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name`        VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `image_urls`  JSON NULL,
  `sort_order`  SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at`  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status`      ENUM('public','draft','private') NOT NULL DEFAULT 'public'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lab_items` (
  `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `section_id` INT UNSIGNED NOT NULL,
  `name`       VARCHAR(500) NOT NULL,
  `sort_order` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`section_id`) REFERENCES `lab_sections`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes
CREATE INDEX idx_projects_sort    ON `projects`       (`sort_order`);
CREATE INDEX idx_projects_cat     ON `projects`       (`category`);
CREATE INDEX idx_messages_read    ON `messages`       (`read`);
CREATE INDEX idx_skills_sort      ON `skills`         (`sort_order`);
CREATE INDEX idx_timeline_sort    ON `timeline`       (`sort_order`);
CREATE INDEX idx_certs_sort       ON `certifications` (`sort_order`);
CREATE INDEX idx_activities_sort  ON `activities`     (`sort_order`);
CREATE INDEX idx_lab_sections_sort ON `lab_sections`  (`sort_order`);
CREATE INDEX idx_lab_items_sort   ON `lab_items`      (`section_id`, `sort_order`);
