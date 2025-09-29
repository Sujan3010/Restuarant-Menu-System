<?php
require_once 'config.php';

function isAdminLoggedIn() {
    session_start();
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

switch ($_SERVER['REQUEST_METHOD']) {
    case 'GET':
        // Get all menu items or filter by category
        $category_id = isset($_GET['category_id']) ? $_GET['category_id'] : null;
        
        try {
            if ($category_id) {
                $stmt = $pdo->prepare("
                    SELECT m.*, c.name as category_name 
                    FROM menu_items m 
                    JOIN categories c ON m.category_id = c.id 
                    WHERE m.category_id = ?
                    ORDER BY m.name
                ");
                $stmt->execute([$category_id]);
            } else {
                $stmt = $pdo->prepare("
                    SELECT m.*, c.name as category_name 
                    FROM menu_items m 
                    JOIN categories c ON m.category_id = c.id 
                    ORDER BY c.name, m.name
                ");
                $stmt->execute();
            }
             $stmt->setFetchMode(PDO::FETCH_ASSOC);
        $items = $stmt->fetchAll();

        echo json_encode($items, JSON_UNESCAPED_SLASHES);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error']);
        }
        break;
        
    case 'POST':
        // Add new menu item (admin only)
        if (!isAdminLoggedIn()) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['name']) || !isset($input['price']) || !isset($input['category_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Name, price, and category_id are required']);
            exit;
        }
       
$imagePath = null;
$inputImage = $input['image_url'] ?? $input['image'] ?? null;

if (!empty($inputImage)) {
  
    $basename = basename($inputImage);

    
    $imagePath = 'http://localhost/rms/img/' . $basename;
}

        try {
            $stmt = $pdo->prepare("
                INSERT INTO menu_items (name, description, price, category_id, image_url, is_available) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $input['name'],
                $input['description'] ?? '',
                $input['price'],
                $input['category_id'],
                $imagePath,
                $input['is_available'] ?? true
            ]);
            
            $id = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'id' => $id, 'message' => 'Menu item added successfully']);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'PUT':
        // Update menu item (admin only)
        if (!isAdminLoggedIn()) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit;
        }
         $imagePath = null;
    $inputImage = $input['image_url'] ?? $input['image'] ?? null;

    if (!empty($inputImage)) {
        $basename = basename($inputImage);
        $imagePath = 'http://localhost/rms/img/' . $basename;
    }
        try {
            $stmt = $pdo->prepare("
                UPDATE menu_items 
                SET name = ?, description = ?, price = ?, category_id = ?, image_url = ?, is_available = ?
                WHERE id = ?
            ");
            $stmt->execute([
                $input['name'],
                $input['description'] ?? '',
                $input['price'],
                $input['category_id'],
              $imagePath,
                $input['is_available'] ?? true,
                $input['id']
            ]);
            
            echo json_encode(['success' => true, 'message' => 'Menu item updated successfully']);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    case 'DELETE':
        // Delete menu item (admin only)
        if (!isAdminLoggedIn()) {
            http_response_code(401);
            echo json_encode(['error' => 'Unauthorized']);
            exit;
        }
        
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'ID is required']);
            exit;
        }
        
        try {
            $stmt = $pdo->prepare("DELETE FROM menu_items WHERE id = ?");
            $stmt->execute([$input['id']]);
            
            echo json_encode(['success' => true, 'message' => 'Menu item deleted successfully']);
        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Method not allowed']);
        break;
}
?>

