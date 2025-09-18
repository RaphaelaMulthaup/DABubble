<?php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $name = $_POST['name'];

    $to = $email;
    $subject = "Willkommen bei DA-Bubble!";
    $message = "Hallo $name,\n\ndanke das du dich bei Da-Bubble registriert hast!";

    $headers =  "From: info@da-bubble.com\r\n" . 
                "Reply-To: info@da-bubble.com\r\n" .
                "Content-Type: text/plain; charset=UTF-8";
                
    if ( mail($to, $subject, $message, $headers)) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error']);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'Method Not Allowed']);
}
?>