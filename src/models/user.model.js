const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    lastName: { type: String, trim: true, maxlength: 50 },
    emailId: {
      type: String,
      required: true,
      unique: true, // creates a unique index in MongoDB
      lowercase: true,
      trim: true,
    },
    // select: false -> password is NOT returned by queries unless asked for explicitly.
    password: { type: String, required: true, select: false },
    age: { type: Number, min: 18 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    photoUrl: { type: String, default: 'https://www.gravatar.com/avatar/?d=mp' },
    about: { type: String, maxlength: 500, default: '' },
    skills: { type: [String], default: [] },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    toJSON: {
      // Controls what gets sent to the client when a document is turned into JSON.
      transform(_doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Mongoose "pre save" hook: hash the password whenever it is new or changed.
// The plain password is never stored.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Instance method: user.comparePassword('plain')
userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
