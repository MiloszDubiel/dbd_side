
CREATE DATABASE dbd;
USE dbd;

-- =========================
-- CHARACTERS
-- =========================
CREATE TABLE characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('killer', 'survivor') NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- PERKS
-- =========================
CREATE TABLE perks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description MEDIUMTEXT NOT NULL,
    character_id INT NULL,
    icon_url TEXT,
    role ENUM('killer', 'survivor') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (character_id)
        REFERENCES characters(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- =========================
-- BUILDS
-- =========================
CREATE TABLE builds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('killer', 'survivor') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- BUILD_PERKS (many-to-many)
-- =========================
CREATE TABLE build_perks (
    build_id INT NOT NULL,
    perk_id INT NOT NULL,

    PRIMARY KEY (build_id, perk_id),

    FOREIGN KEY (build_id)
        REFERENCES builds(id)
        ON DELETE CASCADE,

    FOREIGN KEY (perk_id)
        REFERENCES perks(id)
        ON DELETE CASCADE
);

-- =========================
-- KILLER DETAILS
-- =========================
CREATE TABLE killer_detail (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(255),
    in_game_name VARCHAR(255) NOT NULL UNIQUE,
    game_aliases TEXT,
    gender MEDIUMTEXT,
    origin TEXT,

    power_attack_type VARCHAR(100),
    movement_speed MEDIUMTEXT,
    alternate_movement_speed MEDIUMTEXT,
    terror_radius MEDIUMTEXT,
    height MEDIUMTEXT,

    character_id INT NOT NULL,

    CONSTRAINT fk_killer_character
        FOREIGN KEY (character_id)
        REFERENCES characters(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


CREATE INDEX idx_perks_role ON perks(role);
CREATE INDEX idx_perks_character ON perks(character_id);
CREATE INDEX idx_builds_role ON builds(role);