// routes/classrooms.js
const router = require('express').Router()
const passport = require('../config/auth')
const { Classroom } = require('../models')
const utils = require('../lib/utils')
const processMove = require('../lib/processMove')

const authenticate = passport.authorize('jwt', { session: false })

module.exports = io => {
  router
    .get('/classrooms', (req, res, next) => {
      Classroom.find()
        // Newest classrooms first
        .sort({ createdAt: -1 })
        // Send the data in JSON format
        .then((classrooms) => res.json(classrooms))
        // Throw a 500 error if something goes wrong
        .catch((error) => next(error))
    })
    .get('/classrooms/:id', (req, res, next) => {
      const id = req.params.id

      Classroom.findById(id)
        .then((classroom) => {
          if (!classroom) { return next() }
          res.json(classroom)
        })
        .catch((error) => next(error))
    })
    .post('/classrooms', authenticate, (req, res, next) => {

      console.log('body : ',req.body)
      const newClassroom = {

        batchNumber : req.body.batchNumber,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        students : req.body.students
      }

      Classroom.create(newClassroom)
        .then((classroom) => {
          io.emit('action', {
            type: 'GAME_CREATED',
            payload: classroom
          })
          res.json(classroom)
        })
        .catch((error) => next(error))
    })
    .patch('/classrooms/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      const userId = req.account._id.toString()

      Classroom.findById(id)
        .then((classroom) => {
          if (!classroom) { return next() }

          const updatedClassroom = processMove(classroom, req.body, userId)

          Classroom.findByIdAndUpdate(id, { $set: updatedClassroom }, { new: true })
            .then((classroom) => {
              io.emit('action', {
                type: 'GAME_UPDATED',
                payload: classroom
              })
              res.json(classroom)
            })
            .catch((error) => next(error))
        })
        .catch((error) => next(error))
    })
    .delete('/classrooms/:id', authenticate, (req, res, next) => {
      const id = req.params.id
      Classroom.findByIdAndRemove(id)
        .then(() => {
          io.emit('action', {
            type: 'GAME_REMOVED',
            payload: id
          })
          res.status = 200
          res.json({
            message: 'Removed',
            _id: id
          })
        })
        .catch((error) => next(error))
    })

  return router
}
