import { clerkMiddleware } from "@clerk/nextjs/server";

// 🚀 Umjesto createRouteMatcher, definišemo obični JS niz sa javnim putanjama
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
  '/api/webhook'     
];

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Provjeravamo da li trenutna putanja tačno odgovara nekoj iz niza 
  // ili počinje sa njom (što je JS zamjena za regex-e i parametre poput (.*) ili [token])
  const isPublicRoute = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  // Ako ruta NIJE javna, zaštiti je
  if (!isPublicRoute) {
    // Ispravan način za v5+ unutar middleware callback-a:
    const authObj = await auth();
    
    if (!authObj.userId) {
      // Ako korisnik nije prijavljen, Clerk će ga automatski preusmjeriti na login stranu
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