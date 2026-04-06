/**
 * Add Sample Students - Run this to populate the database with test data
 * 
 * Usage: node add-sample-students.js
 */

const http = require('http');

const sampleStudents = [
  {
    uid: 'A1B2C3D4',
    name: 'John Doe',
    email: 'john.doe@example.com',
    class: 'CSE-2024',
    roll_number: '2024001'
  },
  {
    uid: 'E5F6G7H8',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    class: 'CSE-2024',
    roll_number: '2024002'
  },
  {
    uid: '11223344',
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    class: 'EEE-2024',
    roll_number: '2024003'
  },
  {
    uid: '55667788',
    name: 'Alice Williams',
    email: 'alice.williams@example.com',
    class: 'CSE-2024',
    roll_number: '2024004'
  },
  {
    uid: '99AABBCC',
    name: 'Charlie Brown',
    email: 'charlie.brown@example.com',
    class: 'EEE-2024',
    roll_number: '2024005'
  }
];

function addStudent(student) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(student);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/students',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ Added: ${student.name} (${student.uid})`);
          resolve();
        } else {
          console.log(`❌ Failed: ${student.name} - ${body}`);
          reject(new Error(body));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Network error:`, error.message);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
}

async function addAllStudents() {
  console.log('\n========================================');
  console.log('  Adding Sample Students');
  console.log('========================================\n');
  
  console.log('⚠️  Make sure the server is running on http://localhost:3001\n');
  
  for (const student of sampleStudents) {
    try {
      await addStudent(student);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    } catch (error) {
      // Continue with next student
    }
  }
  
  console.log('\n========================================');
  console.log(`  ✅ Done! Added ${sampleStudents.length} students`);
  console.log('========================================\n');
  console.log('💡 Tip: Modify this file to add your own students!\n');
}

addAllStudents();
