
 
 create table drafts(
 
 id int not null primary key auto_increment,
 name varchar(255) not null,
 user int not null,
 created_at DATE not null 
  );
 
 
 create table draftCourse (
 
 draft_id int not null, 
 course_id int not null,
 created_by int not null,
  foreign key(draft_id) references drafts(id),
 foreign key (course_id) references courses(id),
 foreign key (created_by) references users(id)
 
 );
 
 create table courses(
 id int not null primary key auto_increment,
 user_id int not null,
 course_name varchar(255) not null,
 course_department varchar(255) not null,
 university_name varchar(255) not null,
 course_language varchar(255) not null,
 course_intake varchar(255) not null ,
 course_city varchar(255) not null ,
 course_country varchar(255) not null,
 course_deadline varchar(255) not null,
 gre_score int not null ,
 ielts_or_toefl int not null ,
  course_cgpa decimal(2,1) not null,
 course_percentage int not null,
 foreign key(user_id) references users(id)
 
  );
  
  
  create table users(
  
  id int not null primary key auto_increment,
  first_name varchar(255) not null,
  last_name varchar(255) not null,
  email varchar(255) not null,
  password varchar(255) not null
    );
    
    
    
    
    
    
    
    