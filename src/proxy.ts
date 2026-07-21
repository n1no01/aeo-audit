import { clerkMiddleware } from "@clerk/nextjs/server";

// 🚀 Definišemo obični JS niz sa javnim putanjama
const publicPaths = [
  '/', 
  '/tools/ai-schema-generator',
  '/tools/ai-robots-generator',
  '/tools/aeo-semantic-analyzer',
  '/state-of-aeo',
  '/about',
  '/pricing',
  '/how-it-works',
  '/privacy',
  '/academy',
  '/verify',         
  '/robots.txt',
  '/sitemap.xml',
  '/terms',
  '/sign-in',           
  '/sign-up',          
  '/api/webhook',
  '/api/cron' // 🚀 PUŠTA VERCEL CRON DA PRISTUPI API-JU BEZ CLERK PRIJAVE
];

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Provjeravamo da li trenutna putanja tačno odgovara nekoj iz niza ili počinje sa njom
  const isPublicRoute = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  // Ako ruta NIJE javna, zaštiti je
  if (!isPublicRoute) {
    const authObj = await auth();
    
    if (!authObj.userId) {
      // Ako korisnik nije prijavljen, preusmjeri na sign-in
      return authObj.redirectToSignIn();
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};