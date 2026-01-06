export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // 1. [운영 환경] 리다이렉트 로직
  // 누군가 클라우드플레어 기본 주소(mybias-web.pages.dev)로 접속하면
  // 운영 도메인(savemybias.com)으로 쫓아냅니다.
  // 주의: 'dev' 브랜치 등 다른 프리뷰 주소는 리다이렉트 안 되게 ===(일치) 사용
  if (url.hostname === "mybias-web.pages.dev") {
    // 경로(pathname)와 쿼리스트링(search)까지 유지하면서 이동
    const newUrl = "https://savemybias.com" + url.pathname + url.search;
    return Response.redirect(newUrl, 301);
  }

  // 2. [개발 환경] 검색 엔진 수집 차단 (SEO 보호)
  // dev 도메인이거나, 브랜치별 프리뷰 주소(*.pages.dev)인 경우
  if (
    url.hostname === "dev.savemybias.com" ||
    url.hostname.endsWith(".pages.dev")
  ) {
    // 일단 페이지를 보여줍니다.
    const response = await context.next();

    // 하지만 응답 헤더에 'noindex' 딱지를 붙여서 내보냅니다.
    // 구글 봇: "아, 이 페이지는 검색 결과에 올리면 안 되는구나" 하고 감.
    response.headers.set("X-Robots-Tag", "noindex");
    return response;
  }

  // 3. 그 외 (정상적인 운영 도메인 접속)
  return context.next();
};
