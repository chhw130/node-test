# Node.js 정리: 런타임 · 스트림 · 버퍼 · 이벤트 루프

## 1. Node.js와 브라우저의 차이

Node는 V8에 **파일 시스템용 네이티브 바인딩**(C++로 구현, libuv로 비동기 처리)을 추가로 붙인 런타임이다. 브라우저는 보안상 이걸 붙이지 않았다.

> 💡 JS 자체는 파일 시스템을 처리하지 못한다. 그래서 C++을 통해 제어한다.
> 즉, **커널과 JS를 연결하는 다리가 C++**이다.

## 2. Event Driven

Node.js의 가장 큰 특징은 **Event driven**이다. 어떤 동작이 트리거되면 등록된 리스너를 통해 notify하여 이벤트를 처리한다.

## 3. 스트리밍 처리

Node.js는 기본적으로 데이터를 **스트리밍 처리**한다. 파일이나 데이터 전체를 메모리에 올리는 게 아니라 **chunk 단위로 쪼개서 점진적으로** 전송한다.

### 스트림 4가지 타입

| 타입 | 설명 | 예시 |
| --- | --- | --- |
| Readable | 데이터를 읽어오는 소스 | 파일 읽기, HTTP 요청 body |
| Writable | 데이터를 써넣는 대상 | 파일 쓰기, HTTP 응답 |
| Duplex | 읽기 + 쓰기 둘 다 | TCP 소켓 |
| Transform | 읽으면서 변형해서 씀 | gzip 압축, 암호화 |

### 효과

- 대용량 파일을 다룰 때 **메모리 효율적**
- **TTFB(Time To First Byte)가 빨라짐**: 전체 처리가 끝날 때까지 기다릴 필요 없이, 첫 chunk가 준비되자마자 클라이언트로 보낼 수 있음

## 4. Buffer

기본적으로 JS는 이진 데이터를 다룰 수 없다. 그래서 이진 데이터를 **Buffer**로 변환해서 다룬다.

```js
const fs = require("fs");

// 파일 읽기
fs.readFile("./memo.txt", (err, data) => {
  if (err) {
    console.warn(err);
    return; // 에러 시 아래 로직 실행 방지
  }
  console.log(data); // <Buffer 72 65 61 64 20 6d 65 20 62 72 6f 21>
});
```

## 5. 이벤트 루프와 비동기 처리

이벤트 루프는 **싱글 스레드**로 모든 JS 콜백 실행을 담당한다.
fs 같은 파일 I/O는 **실제 블로킹 작업만 libuv의 워커풀(스레드풀)에 위임**하고, 결과가 준비되면 그 콜백을 다시 이벤트 루프로 가져와 실행한다.

### 실행 순서

```text
동기 코드 실행 (top-level script)
  ↓
process.nextTick 큐 비우기
  ↓
Microtask 큐 비우기 (Promise)
  ↓
┌─────────────────────────────┐
│  ① timers                   │ setTimeout, setInterval 콜백
│  ② pending callbacks        │ 일부 시스템 작업의 에러 콜백 (예: TCP 에러)
│  ③ idle, prepare            │ 내부용 (신경 안 써도 됨)
│  ④ poll                     │ I/O 콜백 실행, 새 I/O 이벤트 대기
│  ⑤ check                    │ setImmediate 콜백
│  ⑥ close callbacks          │ socket.on('close', ...) 등
└─────────────────────────────┘
  ↓ (각 phase 전환 사이마다)
  nextTick 큐 → Microtask 큐 순으로 비움
  ↓
  다시 ① timers 부터 반복
```

> 참고: Node 11 이후로는 nextTick/Microtask 큐가 phase 전환뿐 아니라 **각 콜백 실행 사이마다** 비워진다.

### 예제

```js
console.log('1: 동기 코드');

setTimeout(() => console.log('2: setTimeout'), 0);

setImmediate(() => console.log('3: setImmediate'));

Promise.resolve().then(() => console.log('4: Promise'));

process.nextTick(() => console.log('5: nextTick'));

console.log('6: 동기 코드');
```

**출력**

```text
1: 동기 코드
6: 동기 코드
5: nextTick
4: Promise
2: setTimeout 또는 3: setImmediate
```

- `1 → 6`: 동기 코드가 먼저
- `5 → 4`: nextTick 큐가 Microtask(Promise) 큐보다 먼저
- `2` vs `3`: top-level에서는 **비결정적** (프로세스 성능/타이밍에 따라 달라짐)
  - 단, **I/O 콜백 안에서는 `setImmediate`가 항상 먼저** 실행됨 (poll → check → timers 순서이므로)