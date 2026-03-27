#this is a class og the InternshipPlacement
from datetime import date
class InternshipPlacement:
    #init calls its self when the class is called
    def __init__(self, student_name, company_name, start_date, end_date):
        self.student_name=student_name
        self.company_name=company_name
        self.start_date=start_date
        self.end_date=end_date
        
    def duration(self):
        diff = self.end_date - self.start_date
        return (f"The Internship lasts for {diff.days} days")
        
class User:     
    def __init__(self, username, role, email):
        self.username= username
        self.role = role
        self.email = email
    def is_student(self):
        if self.role == "student":
            return True
        else:
            return False
class Person:
    def __init__(self,name,email):
        self.name = name
        self.email = email

class Student(Person):
    def __init__(self,name, email, student_id):
        super().__init__(name, email)
        self.student_id= student_id

class WeeklyLog:
    def __init__(self, week_number, activities, status="Draft"):
        self.week_number=week_number
        self.activities=activities
        self.status= status
    def submit(self):
        self.status = "submitted"
        return (f"Log {self.status}")
        
        
p = InternshipPlacement("Mugabe Gideon", "MTN-Uganda", date(2026,6,1), date(2026, 8, 30)) 
print(p.duration())    

s= Student("Mugabe", "mugabegideon44@gmail.com", "S001")
print(s.name)
print(s.email)
print(s.student_id)

log = WeeklyLog(1, "I worked on Django models")
print(log.status)
log.submit()
print(log.status)


      
