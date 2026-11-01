# 사주운세 (Saju Fortune)

생년월일시를 입력하면 **사주팔자, 오행 분포, 용신, 주제별 운세(종합·연애·재물·직업·건강), 궁합 점수**를 보여주는 심플한 웹사이트입니다.

- 모든 계산은 브라우저 안에서 처리됩니다 (서버 불필요)
- [saju-fortune](https://www.npmjs.com/package/saju-fortune) 오픈소스 패키지를 esbuild로 브라우저 번들링
- 배포: GitHub Pages

## 시작하기

```bash
npm install
npm run build    # public/saju.js 생성 (saju-fortune 브라우저 번들)
npm run serve    # http://localhost:8080 에서 로컬 실행
```

`public/` 폴더가 정적 사이트의 루트입니다.

## 배포 (GitHub Pages)

```bash
# 저장소 생성 (이미 만들었다면 건너뛰기)
gh repo create saju-website --public --source=. --remote=origin --push

# public/ 내용을 gh-pages 브랜치로 배포
gh api repos/{owner}/saju-website/pages \
  -X POST -f "source[branch]=gh-pages" -f "source[path]=/"
```

## 주의

사주 풀이는 전통 해석을 바탕으로 한 **재미와 자기점검용 참고 자료**이며 의료·투자·법률 등 중요한 결정을 대신하지 않습니다.

## 라이선스

- 코드: MIT (이 저장소)
- 사주 계산 로직: [saju-fortune](https://github.com/NomaDamas/k-skill) (MIT)
