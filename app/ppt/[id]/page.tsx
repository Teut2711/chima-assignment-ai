'use client'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
const PPTView = () => {
  const searchParams = useSearchParams()

  const pptData = searchParams.get('pptData')

  if (!pptData) {
    return <h1 color="black">Loading...</h1>
  }

  // Convert pptData to a base64-encoded data URL
  const dataUrl = `data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,${pptData}`
  console.log(dataUrl)
  return (
    <>
      <h1 color="black">Embedded PowerPoint Presentation</h1>
      <iframe src={dataUrl} width="100%" height="600px"></iframe>
    </>
  )
}

export default PPTView
