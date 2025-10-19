import fs from 'fs/promises'
import path from 'path'

interface ProductTemplateParams {
  product_name: string
  category_id: string
  forAbrdBuyClf: string
  html_detail: string
  price: string
  island_dilivery_cost: string
  return_delivery_cost: string
  exchange_delivery_cost: string
  thumbnails: string
  options: string
}

export async function getProductXmlTemplate(params: ProductTemplateParams): Promise<string> {
  let template: string

  // forAbrdBuyClf 값에 따라 다른 템플릿 파일 사용
  if (params.forAbrdBuyClf === '1') {
    const templatePath = path.join(process.cwd(), 'src/app/api/street11/templates/global_product.xml')
    template = await fs.readFile(templatePath, 'utf-8')
  } else {
    const templatePath = path.join(process.cwd(), 'src/app/api/street11/templates/product.xml')
    template = await fs.readFile(templatePath, 'utf-8')
  }

  // Replace all placeholders with actual values
  Object.entries(params).forEach(([key, value]) => {
    template = template.replace(new RegExp(`\\$\{${key}\}`, 'g'), value)
  })

  console.log('template : ', template)
  return template
}
