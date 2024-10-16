const {Prisma}= require("@prisma/client")
const bcrypt= require ('bcrypt')

module.exports= Prisma.defineExtension({
    query:{
       user: {
           create: async({args,query})=>{
               try {
                   const hash = await bcrypt.hash(args.data.password,10)
                   args.data.password=hash
                   return query(args)
               } catch (err) {
                   throw err  
               }
           }
    }
   }}
)