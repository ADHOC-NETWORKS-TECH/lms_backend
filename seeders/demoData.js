const bcrypt = require('bcrypt');
const { User, Course, Module, Lesson, Subscription } = require('../models/associations');
const sequelize = require('../config/database');

const seedData = async () => {
  try {
    // Clear existing data
    await sequelize.sync({ force: true });
    
    console.log('📦 Creating demo data (Udemy Style - Custom Prices)...');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    });
    console.log('✅ Admin created');

    // Create student user
    const student = await User.create({
      name: 'Demo Student',
      email: 'student@example.com',
      password: await bcrypt.hash('student123', 10),
      role: 'student'
    });
    console.log('✅ Student created');

    // Create courses with custom prices
    const jsCourse = await Course.create({
      title: 'Complete JavaScript Course',
      description: 'Master JavaScript from basics to advanced concepts with real-world projects',
      thumbnail: 'https://via.placeholder.com/300x200?text=JavaScript',
      price_1month: 599,
      price_3months: 1499,
      price_6months: 2499
    });
    console.log('✅ JavaScript course created (1m: ₹599, 3m: ₹1499, 6m: ₹2499)');

    const reactCourse = await Course.create({
      title: 'React.js Masterclass',
      description: 'Build modern web applications with React, Hooks, and Redux',
      thumbnail: 'https://via.placeholder.com/300x200?text=React',
      price_1month: 799,
      price_3months: 1999,
      price_6months: 3299
    });
    console.log('✅ React course created (1m: ₹799, 3m: ₹1999, 6m: ₹3299)');

    const pythonCourse = await Course.create({
      title: 'Python for Beginners',
      description: 'Learn Python programming from scratch with practical examples',
      thumbnail: 'https://via.placeholder.com/300x200?text=Python',
      price_1month: 399,
      price_3months: 999,
      price_6months: 1699
    });
    console.log('✅ Python course created (1m: ₹399, 3m: ₹999, 6m: ₹1699)');

    // Add modules and lessons for JavaScript course
    const jsModule1 = await Module.create({
      courseId: jsCourse.id,
      title: 'JavaScript Fundamentals',
      order: 1
    });

    await Lesson.create({
      moduleId: jsModule1.id,
      title: 'Introduction to JavaScript',
      videoUrl: 'https://vimeo.com/123456789',
      order: 1,
      duration: 15
    });

    await Lesson.create({
      moduleId: jsModule1.id,
      title: 'Variables and Data Types',
      videoUrl: 'https://vimeo.com/123456790',
      order: 2,
      duration: 20
    });

    await Lesson.create({
      moduleId: jsModule1.id,
      title: 'Functions and Scope',
      videoUrl: 'https://vimeo.com/123456791',
      order: 3,
      duration: 25
    });

    const jsModule2 = await Module.create({
      courseId: jsCourse.id,
      title: 'Advanced JavaScript',
      order: 2
    });

    await Lesson.create({
      moduleId: jsModule2.id,
      title: 'Async JavaScript (Promises)',
      videoUrl: 'https://vimeo.com/123456792',
      order: 1,
      duration: 30
    });

    await Lesson.create({
      moduleId: jsModule2.id,
      title: 'ES6+ Features',
      videoUrl: 'https://vimeo.com/123456793',
      order: 2,
      duration: 25
    });

    // After creating lessons, add quizzes
const finalQuiz = await Quiz.create({
  courseId: jsCourse.id,
  title: 'JavaScript Final Exam',
  description: 'Test your JavaScript knowledge',
  type: 'final',
  passingScore: 70,
  timeLimit: 30
});

await QuizQuestion.create({
  quizId: finalQuiz.id,
  questionText: 'What is JavaScript?',
  options: ['A styling language', 'A programming language', 'A database', 'A markup language'],
  correctAnswer: 1,
  explanation: 'JavaScript is a programming language used for web development',
  points: 1
});

await QuizQuestion.create({
  quizId: finalQuiz.id,
  questionText: 'Which keyword is used to declare a variable in JavaScript?',
  options: ['var', 'let', 'const', 'All of the above'],
  correctAnswer: 3,
  points: 1
});

console.log('✅ Quiz created with 2 questions');

    // Create subscription for student to JavaScript course (3 months access)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    await Subscription.create({
      userId: student.id,
      courseId: jsCourse.id,
      plan: '3months',
      startDate,
      endDate,
      status: 'active',
      amount: jsCourse.price_3months
    });
    console.log('✅ Student purchased JavaScript course (3 months access - ₹1499)');

    console.log('\n🎉 Demo data seeding completed!');
    console.log('\n📝 Login Credentials:');
    console.log('Admin Email: admin@example.com | Password: admin123');
    console.log('Student Email: student@example.com | Password: student123');
    console.log('\n📚 Course Prices:');
    console.log('JavaScript: 1m: ₹599, 3m: ₹1499, 6m: ₹2499');
    console.log('React: 1m: ₹799, 3m: ₹1999, 6m: ₹3299');
    console.log('Python: 1m: ₹399, 3m: ₹999, 6m: ₹1699');
    console.log('\n✅ Student has access to: JavaScript Course (expires in 90 days)');
    console.log('❌ Student does NOT have access to: React Course, Python Course');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();