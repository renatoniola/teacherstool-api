// routes/classrooms.js
const router = require('express').Router()
const passport = require('../../config/auth')
const { Classroom, User } = require('../../models')

const authenticate = passport.authorize('jwt', { session: false })

const loadClassroom = (req, res, next) => {
  const id = req.params.id

  Classroom.findById(id)
    .then((classroom) => {
      req.classroom = classroom
      next()
    })
    .catch((error) => next(error))
}

const getStudents = (req, res, next) => {
  Promise.all(req.classroom.students.map(student => User.findById(student.userId)))
    .then((users) => {
      // Combine student data and user's name
      req.students = req.classroom.students.map((student) => {
        const { name } = users
          .filter((u) => u._id.toString() === student.userId.toString())[0]

        return {
          userId: student.userId,
          symbol: student.symbol,
          name
        }
      })
      next()
    })
    .catch((error) => next(error))
}

module.exports = io => {
  router
    .get('/classrooms/:id/students', loadClassroom, getStudents, (req, res, next) => {
      if (!req.classroom || !req.students) { return next() }
      res.json(req.students)
    })

    .post('/classrooms/:id/students', authenticate, loadClassroom, (req, res, next) => {

      console.log(req.body)
      if (!req.classroom) { return next() }

      const { name , photo , evaluations } = req.body

      let createStudentObject = function(name , photo , evaluations){
         if( photo != '' && photo !=   undefined){
            return { name, photo , evaluations }
         }
         return { name , evaluations }
      }
      // const userId = req.account._id
      //
      // if (req.classroom.students.filter((p) => p.userId.toString() === userId.toString()).length > 0) {
      //   const error = Error.new('You already joined this classroom!')
      //   error.status = 401
      //   return next(error)
      // }

      // Add the user to the students
      //let classroom = req.classroom.findById(req.params.id)

      req.classroom.students = [...req.classroom.students, createStudentObject(name , photo , evaluations)]

      req.classroom.save()
        .then((newClassroom) => {
          req.classroom = newClassroom
          io.emit('action', {
            type: 'CLASSROOM_UPDATED',
            payload: req.classroom
          })
        })
        .catch((error) => next(error))
    },
    // Fetch new student data
    getStudents,
    // Respond with new student data in JSON and over socket
    (req, res, next) => {
      io.emit('action', {
        type: 'CLASSROOM_STUDENTS_UPDATED',
        payload: {
          classroom: req.classroom,
          students: req.students
        }
      })
      res.json(req.students)
    })

    .delete('/classrooms/:id/student/:studentId', authenticate, loadClassroom,(req, res, next) => {

      if (!req.classroom) { return next() }

      // const userId = req.account._id
      // const currentStudent = req.classroom.students.filter((p) => p.userId.toString() === userId.toString())[0]
      //
      // if (!currentStudent) {
      //   const error = Error.new('You are not a student of this classroom!')
      //   error.status = 401
      //   return next(error)
      // }
      console.log(req.body)
      const classroomId = req.params.id
      const  studentId  = req.params.studentId
      console.log('studentId : ',studentId)

      req.classroom.students = req.classroom.students.filter((p) => p._id.toString() !== studentId.toString())

      req.classroom.save()
        .then((classroom) => {
          req.classroom = classroom
          io.emit('action', {
            type: 'CLASSROOM_UPDATED',
            payload: req.classroom
          })
          //next()
        })
        .catch((error) => next(error))

    },
    // Fetch new student data
    getStudents,
    // Respond with new student data in JSON and over socket
    (req, res, next) => {
      io.emit('action', {
        type: 'CLASSROOM_STUDENTS_UPDATED',
        payload: {
          classroom: req.classroom,
          students: req.students
        }
      })
      res.json(req.students)
    })

  return router
}
