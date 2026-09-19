// Comprime una imagen en el navegador antes de subirla: la redimensiona
// a un máximo de 1600px de lado y ajusta la calidad JPEG hasta que
// pese menos que el objetivo indicado (por defecto 500 KB).
export function comprimirImagen(file, maxSizeKB = 500, maxDim = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('No se pudo procesar la imagen'))
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        let calidad = 0.82
        const intentar = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) { reject(new Error('No se pudo comprimir la imagen')); return }
              if (blob.size <= maxSizeKB * 1024 || calidad <= 0.35) {
                resolve(blob)
              } else {
                calidad -= 0.1
                intentar()
              }
            },
            'image/jpeg',
            calidad
          )
        }
        intentar()
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}
