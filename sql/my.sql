DROP DATABASE doublespark2;

BEGIN;

CREATE DATABASE doublespark2 default character SET utf8;

USE doublespark2;

CREATE TABLE account (
    account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , data MEDIUMBLOB NOT NULL
    , last_login DATETIME NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;
CREATE TABLE tw_account (
    tw_account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , code VARCHAR(256) character set ascii NOT NULL UNIQUE COMMENT 'tw-user_id'
    , name VARCHAR(20) character set ascii NOT NULL UNIQUE
    , data MEDIUMBLOB NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;
CREATE TABLE fb_account (
    fb_account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , code VARCHAR(256) character set ascii NOT NULL UNIQUE COMMENT 'fb-id'
    , name VARCHAR(256) NOT NULL
    , data MEDIUMBLOB NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;
CREATE TABLE email_account (
    email_account_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , account_id BIGINT UNSIGNED NOT NULL
    , code VARCHAR(256) character set ascii NOT NULL UNIQUE COMMENT 'email address'
    , name VARCHAR(20)
    , password_saltedhash VARCHAR(256)
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
    , FOREIGN KEY (account_id) REFERENCES account(account_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;
CREATE TABLE list (
    list_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , code VARCHAR(256) character set ascii NOT NULL COMMENT '*_account.code'
    , data MEDIUMBLOB NOT NULL
    , created_on DATETIME NOT NULL
    , updated_on DATETIME NOT NULL
) ENGINE=InnoDB charset=utf8;
CREATE INDEX list_code ON list(code);
CREATE TABLE list_member (
    list_member_id BIGINT UNSIGNED NOT NULL PRIMARY KEY AUTO_INCREMENT
    , list_id BIGINT UNSIGNED NOT NULL
    , code VARCHAR(256) character set ascii NOT NULL COMMENT '*_account.code'
    , created_on DATETIME NOT NULL
    , FOREIGN KEY (list_id) REFERENCES list(list_id) ON DELETE CASCADE
) ENGINE=InnoDB charset=utf8;
CREATE INDEX list_member_code ON list_member(code);

COMMIT;