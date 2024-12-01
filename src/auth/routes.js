const Joi = require('joi');
const userController = require('./controllers');

const routes = [
    // Endpoint Registrasi
    {
        method: 'POST',
        path: '/registrasi',
        handler: userController.registrasi,
        options: {
            validate: {
                payload: Joi.object({
                    namaPerusahaan: Joi.string().required(),
                    email: Joi.string().email().required(),
                    nomorTelpon: Joi.string().pattern(/^\+62\d+$/).required(),
                    kapasitasGudang: Joi.number().required(),
                    lokasiMitra: Joi.string().required(),
                }),
                failAction: (request, h, err) => {
                    throw err;
                },
            },
        },
    },
    // Endpoint Approve User (admin memberikan password)
{
    method: 'POST',
    path: '/admin/approve-user',
    handler: userController.approveUser,
    options: {
        validate: {
            payload: Joi.object({
                userId: Joi.number().required(),
                password: Joi.string().min(8).required(), // Password yang diberikan oleh admin
            }),
            failAction: (request, h, err) => {
                throw err;
            },
        },
    },
},


    // Endpoint Login
    {
        method: 'POST',
        path: '/login',
        handler: userController.login,
        options: {
            validate: {
                payload: Joi.object({
                    email: Joi.string().email().required(),
                    password: Joi.string().min(8).required(),
                }),
                failAction: (request, h, err) => {
                    throw err;
                },
            },
        },
    },

    // Endpoint Profile - GET
    {
        method: 'GET',
        path: '/profile',
        handler: userController.getProfile,
    },

    // Endpoint Profile - PUT
    {
        method: 'PUT',
        path: '/profile',
        handler: userController.updateProfile,
        options: {
            validate: {
                payload: Joi.object({
                    namaPerusahaan: Joi.string().optional(),
                    nomorTelpon: Joi.string().pattern(/^08\d+$/).optional(),
                    kapasitasGudang: Joi.number().optional(),
                    lokasiMitra: Joi.string().optional(),
                }),
                failAction: (request, h, err) => {
                    throw err;
                },
            },
        },
    },
];

module.exports = routes;
