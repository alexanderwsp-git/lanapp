/**
 * Iconografía compartida para flujos de Análisis y Medicina.
 * @see https://react-icons.github.io/react-icons/
 */
import type { IconType } from "react-icons"
import { FaUserDoctor } from "react-icons/fa6"
import { GiMedicines } from "react-icons/gi"
import { GrSchedule } from "react-icons/gr"
import { HiOutlineClock, HiOutlineHeart, HiOutlineTrash } from "react-icons/hi2"
import { IoAdd } from "react-icons/io5"
import { MdBiotech, MdCancel, MdEdit } from "react-icons/md"

/** Diagnóstico / registrar resultado de análisis */
export const IconDiagnosis: IconType = FaUserDoctor

/** Aplicar o registrar medicamento */
export const IconApplyMedicine: IconType = GiMedicines

/** Programar análisis o aplicación futura */
export const IconSchedule: IconType = GrSchedule

/** Módulo y estudios de salud (FAMACHA, coprológico, etc.) */
export const IconAnalysis: IconType = MdBiotech

/** Catálogo / módulo de medicamentos */
export const IconMedicine: IconType = GiMedicines

/** Editar registro existente */
export const IconEdit: IconType = MdEdit

/** Cancelar programación */
export const IconCancel: IconType = MdCancel

/** Eliminar */
export const IconDelete: IconType = HiOutlineTrash

/** Crear / agregar (tipos, registros ad-hoc) */
export const IconAdd: IconType = IoAdd

/** Vence hoy / pendiente por fecha */
export const IconDue: IconType = HiOutlineClock

/** Montas / reproducción */
export const IconMating: IconType = HiOutlineHeart
