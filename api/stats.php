<?php
require_once 'config.php';

function isAdminLoggedIn() {
    session_start();
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!isAdminLoggedIn()) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    
    try {
        // Get total items
        $stmt = $pdo->prepare("SELECT COUNT(*) as total_items FROM menu_items");
        $stmt->execute();
        $total_items = $stmt->fetch(PDO::FETCH_ASSOC)['total_items'];
        
        // Get available items
        $stmt = $pdo->prepare("SELECT COUNT(*) as available_items FROM menu_items WHERE is_available = 1");
        $stmt->execute();
        $available_items = $stmt->fetch(PDO::FETCH_ASSOC)['available_items'];
        
        // Get categories count
        $stmt = $pdo->prepare("SELECT COUNT(*) as categories FROM categories");
        $stmt->execute();
        $categories = $stmt->fetch(PDO::FETCH_ASSOC)['categories'];
        
        echo json_encode([
            'total_items' => $total_items,
            'available_items' => $available_items,
            'categories' => $categories
        ]);
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>

