import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Definiši koje rute su javne
const isPublicRoute = createRouteMatcher([
  '/', 
  '/about',
  '/pricing',
  '/how-it-works',
  '/privacy',
  '/robots.txt',
  '/sitemap.xml',
  '/terms',
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/api/webhook(.*)' // Obavezno za Stripe kasniji webhook
]);

export default clerkMiddleware(async (auth, request) => {
  // Ako ruta NIJE javna, zaštiti je
  if (!isPublicRoute(request)) {
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