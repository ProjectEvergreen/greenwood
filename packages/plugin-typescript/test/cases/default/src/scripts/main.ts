interface User {
  firstName: string;
  lastName: string;
  role: 'Professor'|'Student';
  age: Number;
}

const user: User = {
  firstName: 'Angela',
  lastName: 'Davis',
  role: 'Professor',
  age: 30
};

console.log(`Hello ${user.firstName} ${user.firstName}!`);