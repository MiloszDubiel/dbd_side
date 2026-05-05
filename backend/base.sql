CREATE DATABASE dbd;
USE dbd;

CREATE TABLE characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    role ENUM('killer', 'survivor') NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE perks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    character_id INT NULL,
    icon_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (character_id) REFERENCES characters(id)
        ON DELETE SET NULL
);

CREATE TABLE builds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role ENUM('killer', 'survivor') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE build_perks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    build_id INT,
    perk_id INT,
    FOREIGN KEY (build_id) REFERENCES builds(id) ON DELETE CASCADE,
    FOREIGN KEY (perk_id) REFERENCES perks(id) ON DELETE CASCADE
);