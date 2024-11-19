-- Create Database
CREATE DATABASE MyWatchlist;
USE MyWatchlist;

-- Table untuk user
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table untuk genre
CREATE TABLE genres (
    genre_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Table untuk studio/production house
CREATE TABLE studios (
    studio_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50),
    founded_year INT
);

-- Table utama untuk anime/film
CREATE TABLE titles (
    title_id INT PRIMARY KEY AUTO_INCREMENT,
    type ENUM('ANIME', 'MOVIE') NOT NULL,
    title VARCHAR(255) NOT NULL,
    alternative_titles JSON,  -- Untuk menyimpan judul dalam berbagai bahasa
    synopsis TEXT,
    cover_image_url VARCHAR(255),
    release_date DATE,
    end_date DATE,
    status ENUM('FINISHED', 'ONGOING', 'UPCOMING') NOT NULL,
    episode_count INT,
    duration INT,  -- Dalam menit
    studio_id INT,
    rating_average DECIMAL(3,2) DEFAULT 0,
    rating_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studio_id) REFERENCES studios(studio_id)
);

-- Table untuk relasi many-to-many antara titles dan genres
CREATE TABLE title_genres (
    title_id INT,
    genre_id INT,
    PRIMARY KEY (title_id, genre_id),
    FOREIGN KEY (title_id) REFERENCES titles(title_id),
    FOREIGN KEY (genre_id) REFERENCES genres(genre_id)
);

-- Table untuk staff/cast
CREATE TABLE people (
    person_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    alternative_names JSON,
    biography TEXT,
    birth_date DATE,
    country VARCHAR(50)
);

-- Table untuk relasi staff/cast dengan titles
CREATE TABLE title_people (
    title_id INT,
    person_id INT,
    role ENUM('DIRECTOR', 'ACTOR', 'VOICE_ACTOR', 'WRITER', 'PRODUCER') NOT NULL,
    character_name VARCHAR(100),  -- Untuk aktor/pengisi suara
    PRIMARY KEY (title_id, person_id, role),
    FOREIGN KEY (title_id) REFERENCES titles(title_id),
    FOREIGN KEY (person_id) REFERENCES people(person_id)
);

-- Table untuk user watchlist
CREATE TABLE user_lists (
    user_id INT,
    title_id INT,
    status ENUM('WATCHING', 'COMPLETED', 'ON_HOLD', 'DROPPED', 'PLAN_TO_WATCH') NOT NULL,
    progress INT DEFAULT 0,  -- Episode terakhir yang ditonton
    PRIMARY KEY (user_id, title_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (title_id) REFERENCES titles(title_id)
);

-- Table untuk rating
CREATE TABLE ratings (
    rating_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title_id INT,
    score DECIMAL(3,1) NOT NULL CHECK (score >= 0 AND score <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_title_rating (user_id, title_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (title_id) REFERENCES titles(title_id)
);

-- Table untuk review
CREATE TABLE reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    title_id INT,
    content TEXT NOT NULL,
    likes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (title_id) REFERENCES titles(title_id)
);

-- Sample data untuk testing
INSERT INTO genres (name) VALUES 
('Action'),
('Comedy'),
('Drama'),
('Fantasy'),
('Horror'),
('Romance'),
('Sci-Fi'),
('Thriller');

INSERT INTO studios (name, country, founded_year) VALUES
('Studio Ghibli', 'Japan', 1985),
('Warner Bros.', 'USA', 1923),
('MAPPA', 'Japan', 2011),
('A24', 'USA', 2012);

INSERT INTO titles (type, title, synopsis, status, episode_count, studio_id) VALUES
('ANIME', 'Attack on Titan', 'Humanity fights for survival against giant humanoids called Titans', 'FINISHED', 87, 3),
('MOVIE', 'Spirited Away', 'A young girl enters the spirit world to save her parents', 'FINISHED', 1, 1),
('MOVIE', 'Everything Everywhere All at Once', 'An aging Chinese immigrant is swept up in an insane adventure', 'FINISHED', 1, 4);

INSERT INTO users (username, email, password_hash) VALUES
('anime_fan', 'fan@example.com', 'hashed_password_here'),
('movie_lover', 'movie@example.com', 'hashed_password_here');