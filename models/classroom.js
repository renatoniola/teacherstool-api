const mongoose = require('../config/database')
const { Schema } = mongoose


const evaluationSchema = new Schema({
  remark: { type : String , required: function() { return ( this.colorCode === 'red' || this.colorCode === 'yellow')  } },
  colorCode : { type : String  },
  day: { type : Date , default : Date.now }
})

const studentSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId },
  name: { type : String },
  photo: { type : String , default : 'http://via.placeholder.com/250x150'},
  evaluations : [evaluationSchema]
})




const classroomSchema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'users' },
  students: [studentSchema],
  batchNumber : { type : String },
  startDate: { type : Date , default : Date.now},
  endDate: { type : Date , default : Date.now},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('classrooms', classroomSchema)
