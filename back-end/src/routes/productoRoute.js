import { getAllp } from "../controller/productoController.js";
import express from 'express' //Contiene una funcion router que permite el enrutamiento  -Enrutamineto-Es gestionar los dso tipos de peticiones (Request y respond)

const router = express.Router()

router.get('/List', getAllp)

export default router;