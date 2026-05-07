const dotenv = require('dotenv');
const connectDB = require('../config/db');
const User = require('../models/User');

dotenv.config();

const seedDemoUser = async () => {
  try {
    await connectDB();

    const demoEmail = process.env.DEMO_EMAIL || 'demo@gmail.com';
    const demoPassword = process.env.DEMO_PASSWORD || 'Demo1234';
    const demoUsername = process.env.DEMO_USERNAME || 'demoauthor';

    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      user = await User.create({
        username: demoUsername,
        email: demoEmail,
        password: demoPassword,
        bio: 'Demo account for evaluator access.',
        socialLinks: {
          twitter: '',
          linkedin: '',
          github: '',
          website: ''
        }
      });

      console.log(`Demo user created: ${user.email}`);
    } else {
      console.log(`Demo user already exists: ${user.email}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Failed to seed demo user:', error);
    process.exit(1);
  }
};

seedDemoUser();
