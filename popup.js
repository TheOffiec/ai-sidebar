
const btn = document.getElementById('allow-btn');

btn.addEventListener('click', async () => {
    try {
        // Wywołujemy prośbę o mikrofon
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        console.log("Dostęp przyznany!");
        
        // Wyłączamy mikrofon po uzyskaniu zgody
        stream.getTracks().forEach(track => track.stop());
        
        // Informujemy użytkownika i zamykamy kartę
        alert("Super! Teraz mikrofon będzie działał w panelu bocznym.");
        window.close();
    } catch (err) {
        console.error("Błąd podczas prośby o uprawnienia:", err);
        alert("Nie udało się uzyskać dostępu. Sprawdź ustawienia przeglądarki.");
    }
    return false
});