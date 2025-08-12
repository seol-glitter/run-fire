
document.addEventListener('DOMContentLoaded', () => {
    console.log('Game loaded');

    // 2단계 젖은수건 성공 이미지 표시
    function showWetTowelSuccess() {
        const img = document.createElement('img');
        img.src = 'assets/wet_towel_success.png';
        img.style.position = 'absolute';
        img.style.left = 'calc(50% - 40px)';  // 왼쪽으로 2칸 이동 가정
        img.style.top = 'calc(50% - 30px)';   // 위쪽으로 1.5칸 이동 가정
        img.style.width = '60%'; // 현재 크기의 60%
        document.body.appendChild(img);
    }

    // 예시 실행
    // showWetTowelSuccess(); // 실제 게임 로직에서 호출
});
