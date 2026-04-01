<?php
declare(strict_types=1);

require_once __DIR__ . '/lib/Helpers.php';
require_once __DIR__ . '/lib/Mailer.php';

load_env_file(app_path('.env'));
set_api_headers();
handle_preflight_request();
start_app_session();
enforce_blocked_client_policy();

function content_types(): array
{
    return [
        'services',
        'service_products',
        'clients',
        'jobs',
        'gallery',
        'projects',
        'certificates',
        'testimonials',
    ];
}

function data_dir(): string
{
    return storage_path();
}

function store_path(): string
{
    return data_dir() . DIRECTORY_SEPARATOR . 'store.json';
}

function uploads_dir(): string
{
    return data_dir() . DIRECTORY_SEPARATOR . 'uploads';
}

function resumes_dir(): string
{
    return uploads_dir() . DIRECTORY_SEPARATOR . 'resumes';
}

function resolve_storage_path(string $relativePath): string
{
    $trimmed = trim($relativePath);

    if ($trimmed === '') {
        return app_path();
    }

    if (preg_match('/^(?:[A-Za-z]:\\\\|\\/)/', $trimmed) === 1) {
        return $trimmed;
    }

    $normalized = str_replace(['\\', '/'], DIRECTORY_SEPARATOR, trim($trimmed, '\\/'));
    $dataPrefix = 'data' . DIRECTORY_SEPARATOR;
    $candidates = [];

    if (str_starts_with($normalized, $dataPrefix)) {
        $candidates[] = app_path($normalized);
    } else {
        $candidates[] = data_dir() . DIRECTORY_SEPARATOR . $normalized;
        $candidates[] = app_path($normalized);
        $candidates[] = app_path($dataPrefix . $normalized);
    }

    foreach (array_unique($candidates) as $candidate) {
        if (file_exists($candidate)) {
            return $candidate;
        }
    }

    return $candidates[0];
}

function ensure_directory(string $path): bool
{
    if (is_dir($path)) {
        return true;
    }

    return @mkdir($path, 0777, true) || is_dir($path);
}

function upload_error_message(int $errorCode): string
{
    return match ($errorCode) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Resume exceeds the allowed upload size.',
        UPLOAD_ERR_PARTIAL => 'Resume upload was interrupted. Please try again.',
        UPLOAD_ERR_NO_TMP_DIR => 'PHP upload temp directory is not available on the server.',
        UPLOAD_ERR_CANT_WRITE => 'The server could not write the uploaded resume to disk.',
        UPLOAD_ERR_EXTENSION => 'A server extension blocked the uploaded resume.',
        default => 'Resume upload failed. Please try again.',
    };
}

function uploaded_resume_from_request(): ?array
{
    $file = $_FILES['resume'] ?? null;

    if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    $uploadError = (int)($file['error'] ?? UPLOAD_ERR_OK);
    if ($uploadError !== UPLOAD_ERR_OK) {
        append_app_log(
            'Career resume upload failed before validation. Error=' . $uploadError
            . ' Name=' . sanitize_text((string)($file['name'] ?? 'resume'))
        );
        json_response(['error' => upload_error_message($uploadError)], 422);
    }

    $tmpName = (string)($file['tmp_name'] ?? '');
    if ($tmpName === '' || !is_uploaded_file($tmpName)) {
        json_response(['error' => 'Uploaded resume could not be verified.'], 422);
    }

    $originalName = sanitize_text((string)($file['name'] ?? 'resume'));
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowedExtensions = ['pdf', 'doc', 'docx'];

    if (!in_array($extension, $allowedExtensions, true)) {
        json_response(['error' => 'Resume must be a PDF, DOC, or DOCX file.'], 422);
    }

    $size = (int)($file['size'] ?? 0);
    if ($size <= 0 || $size > 5 * 1024 * 1024) {
        json_response(['error' => 'Resume must be smaller than 5 MB.'], 422);
    }

    $mimeType = 'application/octet-stream';
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $detected = finfo_file($finfo, $tmpName);
            finfo_close($finfo);
            if (is_string($detected) && $detected !== '') {
                $mimeType = $detected;
            }
        }
    }

    $allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/octet-stream',
        'application/zip',
    ];

    if (!in_array($mimeType, $allowedMimeTypes, true)) {
        json_response(['error' => 'Resume file type is not allowed.'], 422);
    }

    if (!ensure_directory(data_dir()) || !ensure_directory(uploads_dir()) || !ensure_directory(resumes_dir())) {
        append_app_log(
            'Career resume upload failed because the uploads directory could not be created. '
            . 'Path=' . resumes_dir()
        );
        json_response(['error' => 'Resume storage is not available on the server.'], 500);
    }

    if (!is_writable(resumes_dir())) {
        append_app_log(
            'Career resume upload failed because the uploads directory is not writable. '
            . 'Path=' . resumes_dir()
        );
        json_response(['error' => 'Resume storage is not writable on the server.'], 500);
    }

    $storedName = hash_identifier($originalName . '|' . microtime(true) . '|' . random_int(1000, 999999))
        . '.'
        . $extension;
    $relativePath = 'uploads/resumes/' . $storedName;
    $absolutePath = resolve_storage_path($relativePath);

    $saved = @move_uploaded_file($tmpName, $absolutePath);

    if (!$saved && is_uploaded_file($tmpName)) {
        $saved = @rename($tmpName, $absolutePath);
    }

    if (!$saved && is_file($tmpName)) {
        $saved = @copy($tmpName, $absolutePath);

        if ($saved) {
            @unlink($tmpName);
        }
    }

    if (!$saved) {
        $lastError = error_get_last();
        append_app_log(
            'Career resume could not be saved. '
            . 'Tmp=' . $tmpName
            . ' Dest=' . $absolutePath
            . ' Error=' . ($lastError['message'] ?? 'unknown')
        );
        json_response(['error' => 'Resume could not be saved. Check upload permissions and try again.'], 500);
    }

    return [
        'originalName' => $originalName,
        'storedName' => $storedName,
        'path' => $relativePath,
        'mimeType' => $mimeType,
        'sizeBytes' => $size,
    ];
}

function default_site_settings(): array
{
    return [
        'site_name' => 'Master Qatar W.L.L.',
        'site_tagline' => 'Engineering excellence in Saudi Arabia',
        'primary_brand_location' => 'KSA-Jeddah',
        'secondary_brand_name' => 'QM Arabia',
        'secondary_brand_location' => 'KSA-Jeddah',
        'office_address' => 'Mezzanine Floor Office No - 1, 7653 Al-Madinah Al-Munawarah Rd, Al-Baghdadiyah Al-Sharqiyah District - 4672, Jeddah 22235',
        'location_url' => '',
        'map_embed_url' => '',
        'primary_phone' => '',
        'secondary_phone' => '',
        'primary_email' => env_value('ADMIN_DEFAULT_EMAIL', 'admin@example.com') ?? 'admin@example.com',
        'contact_recipient_email' => env_value('ADMIN_DEFAULT_EMAIL', 'admin@example.com') ?? 'admin@example.com',
        'careers_recipient_email' => env_value('ADMIN_DEFAULT_EMAIL', 'admin@example.com') ?? 'admin@example.com',
        'business_hours_weekday' => '8AM to 5PM',
        'business_hours_weekend' => 'Friday - Saturday: Closed',
        'sister_company_name' => 'Qatar Masters',
        'sister_company_url' => '',
        'sister_company_location' => 'Doha, Qatar',
        'sister_company_note' => '',
        'mail_from_name' => 'Master Qatar Website',
        'mail_from_email' => env_value('ADMIN_DEFAULT_EMAIL', 'admin@example.com') ?? 'admin@example.com',
        'security_alert_email' => env_value('ADMIN_DEFAULT_EMAIL', 'admin@example.com') ?? 'admin@example.com',
        'facebook_url' => '',
        'linkedin_url' => '',
        'twitter_url' => '',
        'instagram_url' => '',
        'two_factor_auth_enabled' => false,
        'authenticator_period_seconds' => 30,
    ];
}

function seed_content_item(
    int $id,
    string $type,
    string $title,
    array $overrides = []
): array {
    $now = now_utc();

    return array_merge([
        'id' => $id,
        'type' => $type,
        'slug' => null,
        'title' => $title,
        'subtitle' => null,
        'description' => null,
        'imageUrl' => null,
        'ctaLabel' => null,
        'ctaUrl' => null,
        'metadata' => [],
        'sortOrder' => $id,
        'isPublished' => true,
        'showOnHomePage' => false,
        'createdAt' => $now,
        'updatedAt' => $now,
    ], $overrides);
}

function seed_service_product_item(
    int $id,
    string $title,
    string $service,
    string $category,
    int $assetIndex
): array {
    return seed_content_item($id, 'service_products', $title, [
        'metadata' => [
            'service' => $service,
            'category' => $category,
            'assetIndex' => $assetIndex,
        ],
    ]);
}

function default_content_seed(): array
{
    return [
        'services' => [
            seed_content_item(1, 'services', 'MEP Contracting', [
                'slug' => 'mep',
                'description' => 'Engineering, procurement, and construction of complete MEP systems for major infrastructure projects across Saudi Arabia and the GCC region.',
                'showOnHomePage' => true,
                'metadata' => [
                    'highlights' => ['HVAC and chilled water', 'Electrical infrastructure', 'Fire-fighting systems'],
                    'subsections' => [
                        ['title' => 'Electrical Works', 'items' => ['Medium voltage panels', 'Distribution boards', 'Wiring and cabling']],
                        ['title' => 'HVAC Systems', 'items' => ['Central chilled water', 'Split / VRF / VRV systems', 'Ventilation systems']],
                        ['title' => 'Fire Fighting Systems', 'items' => ['Wet and dry risers', 'Sprinkler systems', 'Hydrant systems']],
                    ],
                ],
            ]),
            seed_content_item(2, 'services', 'ELV Systems', [
                'slug' => 'elv',
                'description' => 'Complete Extra Low Voltage system solutions for smart and intelligent buildings, providing security, communication, and operational efficiency.',
                'showOnHomePage' => true,
                'metadata' => [
                    'highlights' => ['BMS and access control', 'CCTV and PA systems', 'Structured cabling'],
                    'subsections' => [
                        ['title' => 'Building and Security Systems', 'items' => ['BMS', 'Access control', 'CCTV surveillance', 'Intruder alarms']],
                        ['title' => 'Data and Communications', 'items' => ['Structured cabling', 'Fiber optic networks', 'Audio visual systems']],
                    ],
                ],
            ]),
            seed_content_item(3, 'services', 'Automation Systems', [
                'slug' => 'automation',
                'description' => 'State-of-the-art automated entrance and loading systems for commercial, industrial, and logistics facilities.',
                'showOnHomePage' => true,
                'metadata' => [
                    'highlights' => ['Automatic doors', 'Roller shutters', 'Loading bay equipment'],
                    'subsections' => [
                        ['title' => 'Entrance and Access Solutions', 'items' => ['Automatic sliding doors', 'Automatic swing doors', 'Revolving doors', 'Gate barriers']],
                    ],
                ],
            ]),
            seed_content_item(4, 'services', 'Facility Management', [
                'slug' => 'fm',
                'description' => 'Comprehensive facility management services to keep buildings running at peak efficiency while reducing downtime and operating costs.',
                'showOnHomePage' => true,
                'metadata' => [
                    'highlights' => ['HVAC servicing', 'Building maintenance', 'Cleaning and support'],
                    'subsections' => [
                        ['title' => 'Maintenance Services', 'items' => ['Electrical maintenance', 'HVAC maintenance', 'Building maintenance']],
                        ['title' => 'Support Services', 'items' => ['Cleaning and housekeeping', 'Landscaping', 'Waste management']],
                    ],
                ],
            ]),
            seed_content_item(5, 'services', 'Workforce Solutions', [
                'slug' => 'workforce',
                'description' => 'Skilled manpower and HR support tailored to the construction and engineering sector across the GCC.',
                'metadata' => [
                    'highlights' => ['Skilled manpower', 'Mobilization support', 'Payroll management'],
                    'subsections' => [
                        ['title' => 'HR and Manpower Services', 'items' => ['Contract staffing', 'PRO services', 'Labour camp accommodation']],
                    ],
                ],
            ]),
            seed_content_item(6, 'services', 'Trading', [
                'slug' => 'trading',
                'description' => 'Authorized supply of premium HVAC materials, MEP equipment, and engineering products from leading global manufacturers.',
                'metadata' => [
                    'highlights' => ['HVAC equipment', 'Electrical equipment', 'Automation equipment'],
                    'subsections' => [
                        ['title' => 'Products and Equipment', 'items' => ['HVAC materials', 'Electrical equipment', 'Fire fighting equipment', 'ELV components']],
                    ],
                ],
            ]),
        ],
        'service_products' => [
            seed_service_product_item(1, 'MEP Sector Overview', 'MEP', 'Systems', 1),
            seed_service_product_item(2, 'Electrical Works', 'MEP', 'Systems', 2),
            seed_service_product_item(3, 'Plumbing Systems', 'MEP', 'Systems', 3),
            seed_service_product_item(4, 'HVAC Systems', 'MEP', 'Systems', 4),
            seed_service_product_item(5, 'Fire Fighting Systems', 'MEP', 'Systems', 5),
            seed_service_product_item(6, 'Building Management Systems (BMS)', 'ELV', 'Systems', 1),
            seed_service_product_item(7, 'Access Control Systems', 'ELV', 'Systems', 2),
            seed_service_product_item(8, 'Security & Surveillance', 'ELV', 'Systems', 3),
            seed_service_product_item(9, 'Lighting Control Systems', 'ELV', 'Systems', 4),
            seed_service_product_item(10, 'Public Address Systems', 'ELV', 'Systems', 5),
            seed_service_product_item(11, 'Structured Cable Solutions', 'ELV', 'Systems', 6),
            seed_service_product_item(12, 'Home Automation', 'ELV', 'Systems', 7),
            seed_service_product_item(13, 'Airflow Control Systems', 'ELV', 'Systems', 8),
            seed_service_product_item(14, 'Room Pressure Monitoring Systems', 'ELV', 'Systems', 9),
            seed_service_product_item(15, 'Automatic Sliding Doors', 'Automation', 'Doors', 1),
            seed_service_product_item(16, 'Automatic Swing Doors', 'Automation', 'Doors', 2),
            seed_service_product_item(17, 'Revolving Doors', 'Automation', 'Doors', 3),
            seed_service_product_item(18, 'Roller Shutters', 'Automation', 'Doors', 4),
            seed_service_product_item(19, 'High-Speed Doors', 'Automation', 'Doors', 5),
            seed_service_product_item(20, 'Fresh Air Louvers', 'Trading', 'HVAC', 1),
            seed_service_product_item(21, 'Volume Control Damper', 'Trading', 'HVAC', 2),
            seed_service_product_item(22, 'Non Return Dampers', 'Trading', 'HVAC', 3),
            seed_service_product_item(23, 'Acoustic Louvers', 'Trading', 'HVAC', 4),
            seed_service_product_item(24, 'Sound Attenuators', 'Trading', 'HVAC', 5),
            seed_service_product_item(25, 'Pressure Relief Dampers', 'Trading', 'HVAC', 6),
            seed_service_product_item(26, 'Constant Air Volume (CAV)', 'Trading', 'HVAC', 7),
            seed_service_product_item(27, 'Sand Trap Louvers', 'Trading', 'HVAC', 8),
            seed_service_product_item(28, 'Linear Slot Diffusers', 'Trading', 'HVAC', 9),
            seed_service_product_item(29, 'Round Ceiling Diffusers', 'Trading', 'HVAC', 10),
            seed_service_product_item(30, 'Swirl Diffusers', 'Trading', 'HVAC', 11),
            seed_service_product_item(31, 'Jet Diffusers', 'Trading', 'HVAC', 12),
            seed_service_product_item(32, 'Ceiling Diffusers', 'Trading', 'HVAC', 13),
            seed_service_product_item(33, 'Linear Diffusers', 'Trading', 'HVAC', 14),
            seed_service_product_item(34, 'Registers', 'Trading', 'HVAC', 15),
            seed_service_product_item(35, 'Grilles', 'Trading', 'HVAC', 16),
            seed_service_product_item(36, 'Variable Air Volume (VAV)', 'Trading', 'HVAC', 17),
            seed_service_product_item(37, 'Fire Dampers', 'Trading', 'Safety', 18),
            seed_service_product_item(38, 'Disc Valves', 'Trading', 'HVAC', 19),
        ],
        'clients' => [
            seed_content_item(1, 'clients', 'Siemens', ['metadata' => ['sector' => 'Engineering', 'logoIndex' => 1], 'showOnHomePage' => true]),
            seed_content_item(2, 'clients', 'Honeywell', ['metadata' => ['sector' => 'Automation and Controls', 'logoIndex' => 2], 'showOnHomePage' => true]),
            seed_content_item(3, 'clients', 'Schneider Electric', ['metadata' => ['sector' => 'Energy Management', 'logoIndex' => 3], 'showOnHomePage' => true]),
            seed_content_item(4, 'clients', 'Johnson Controls', ['metadata' => ['sector' => 'Building Technology', 'logoIndex' => 4], 'showOnHomePage' => true]),
            seed_content_item(5, 'clients', 'ABB', ['metadata' => ['sector' => 'Power and Automation', 'logoIndex' => 5]]),
            seed_content_item(6, 'clients', 'Bosch', ['metadata' => ['sector' => 'Technology', 'logoIndex' => 6]]),
            seed_content_item(7, 'clients', 'Daikin', ['metadata' => ['sector' => 'HVAC', 'logoIndex' => 7]]),
            seed_content_item(8, 'clients', 'Carrier', ['metadata' => ['sector' => 'HVAC and Refrigeration', 'logoIndex' => 8]]),
            seed_content_item(9, 'clients', 'ASSA ABLOY', ['metadata' => ['sector' => 'Entrance Solutions', 'logoIndex' => 9]]),
            seed_content_item(10, 'clients', 'Tyco Fire', ['metadata' => ['sector' => 'Fire Protection', 'logoIndex' => 10]]),
        ],
        'jobs' => [
            seed_content_item(1, 'jobs', 'MEP Project Engineer', [
                'description' => 'Lead electrical and mechanical delivery for high-rise and infrastructure projects.',
                'metadata' => ['location' => 'Jeddah', 'type' => 'Full-time', 'department' => 'Projects'],
            ]),
            seed_content_item(2, 'jobs', 'ELV Systems Specialist', [
                'description' => 'Design and deploy BMS, CCTV, access control, and fire alarm systems.',
                'metadata' => ['location' => 'Jeddah', 'type' => 'Full-time', 'department' => 'ELV'],
            ]),
            seed_content_item(3, 'jobs', 'Facility Management Coordinator', [
                'description' => 'Manage FM operations and client service delivery for enterprise portfolios.',
                'metadata' => ['location' => 'Jeddah', 'type' => 'Full-time', 'department' => 'Facility Management'],
            ]),
            seed_content_item(4, 'jobs', 'Site Safety Officer', [
                'description' => 'Ensure compliance with safety standards and drive safe execution on site.',
                'metadata' => ['location' => 'Jeddah', 'type' => 'Full-time', 'department' => 'HSE'],
            ]),
        ],
        'gallery' => [
            seed_content_item(1, 'gallery', 'Airport Delivery', ['metadata' => ['category' => 'Projects', 'assetIndex' => 1]]),
            seed_content_item(2, 'gallery', 'Hotel Delivery', ['metadata' => ['category' => 'Projects', 'assetIndex' => 2]]),
            seed_content_item(3, 'gallery', 'Rail Delivery', ['metadata' => ['category' => 'Projects', 'assetIndex' => 3]]),
            seed_content_item(4, 'gallery', 'Stadium Delivery', ['metadata' => ['category' => 'Projects', 'assetIndex' => 4]]),
        ],
        'projects' => [
            seed_content_item(1, 'projects', 'International Airports', [
                'description' => 'Large-scale passenger environments with MEP and ELV coordination at infrastructure scale.',
                'showOnHomePage' => true,
                'metadata' => ['sector' => 'Airport', 'location' => 'GCC', 'scope' => 'MEP and ELV', 'assetIndex' => 1],
            ]),
            seed_content_item(2, 'projects', 'Sports Stadiums', [
                'description' => 'High-performance venues requiring resilient systems and demanding delivery timelines.',
                'showOnHomePage' => true,
                'metadata' => ['sector' => 'Stadium', 'location' => 'GCC', 'scope' => 'MEP Contracting', 'assetIndex' => 2],
            ]),
            seed_content_item(3, 'projects', 'Luxury Hotels', [
                'description' => 'Hospitality builds where guest experience depends on invisible technical precision.',
                'showOnHomePage' => true,
                'metadata' => ['sector' => 'Hotel', 'location' => 'GCC', 'scope' => 'MEP and ELV Systems', 'assetIndex' => 3],
            ]),
            seed_content_item(4, 'projects', 'Railways and Metro', [
                'description' => 'Transit environments that need reliability, safety, and systems integration at every layer.',
                'showOnHomePage' => true,
                'metadata' => ['sector' => 'Railway', 'location' => 'GCC', 'scope' => 'MEP and ELV Systems', 'assetIndex' => 4],
            ]),
            seed_content_item(5, 'projects', 'Hospitals and Healthcare', [
                'description' => 'Critical healthcare facilities requiring precision engineering and dependable maintenance planning.',
                'metadata' => ['sector' => 'Hospital', 'location' => 'GCC', 'scope' => 'MEP and ELV', 'assetIndex' => 5],
            ]),
            seed_content_item(6, 'projects', 'Commercial Towers', [
                'description' => 'Mixed-use and commercial assets delivered with integrated engineering systems.',
                'metadata' => ['sector' => 'Commercial', 'location' => 'GCC', 'scope' => 'MEP', 'assetIndex' => 6],
            ]),
        ],
        'certificates' => [
            seed_content_item(1, 'certificates', 'ISO 9001:2015', [
                'subtitle' => 'Quality Management System',
                'description' => 'Certified for maintaining a robust Quality Management System that ensures consistent delivery.',
                'metadata' => ['issuer' => 'ISO', 'year' => '2025', 'status' => 'Active', 'assetIndex' => 1],
            ]),
            seed_content_item(2, 'certificates', 'ISO 45001:2018', [
                'subtitle' => 'Occupational Health and Safety',
                'description' => 'Certified for implementing a strong Occupational Health and Safety Management System.',
                'metadata' => ['issuer' => 'ISO', 'year' => '2025', 'status' => 'Active', 'assetIndex' => 2],
            ]),
            seed_content_item(3, 'certificates', 'Approved Contractor', [
                'subtitle' => 'FIFA World Cup Delivery Legacy',
                'description' => 'Approved contractor recognition for high-profile project delivery standards.',
                'metadata' => ['issuer' => 'Supreme Committee', 'year' => '2020', 'status' => 'Recognized', 'assetIndex' => 3],
            ]),
            seed_content_item(4, 'certificates', 'Labour Camp Excellence', [
                'subtitle' => 'Award Winning Facility Standards',
                'description' => 'Recognition for outstanding workforce accommodation and support facilities.',
                'metadata' => ['issuer' => 'Ministry of Labour', 'year' => '2019', 'status' => 'Awarded', 'assetIndex' => 4],
            ]),
        ],
        'testimonials' => [
            seed_content_item(1, 'testimonials', 'Reliable Partner', [
                'description' => 'Qatar Masters has been a reliable partner on multiple major projects. Their quality of work and professionalism is consistently outstanding.',
                'metadata' => ['author' => 'Senior Project Director', 'company' => 'Multinational Construction Firm'],
            ]),
            seed_content_item(2, 'testimonials', 'Skilled MEP Team', [
                'description' => 'Their MEP team is highly skilled and well-organized. They completed the electrical works on our flagship project ahead of schedule.',
                'metadata' => ['author' => 'Project Manager', 'company' => 'International Real Estate Developer'],
            ]),
            seed_content_item(3, 'testimonials', 'Committed to Quality', [
                'description' => 'We have been awarding contracts to Qatar Masters for years. Their commitment to quality and safety standards is unmatched.',
                'metadata' => ['author' => 'Engineering Director', 'company' => 'GCC Infrastructure Company'],
            ]),
        ],
    ];
}

function default_role_permissions(string $role): array
{
    return match ($role) {
        'admin' => [
            'overview' => true,
            'contacts' => true,
            'careers' => true,
            'content' => true,
            'settings' => true,
            'users' => true,
            'health' => true,
        ],
        'ceo' => [
            'overview' => true,
            'contacts' => true,
            'careers' => true,
            'content' => true,
            'settings' => false,
            'users' => false,
            'health' => true,
        ],
        'hr' => [
            'overview' => true,
            'contacts' => true,
            'careers' => true,
            'content' => false,
            'settings' => false,
            'users' => false,
            'health' => false,
        ],
        'md', 'staff', 'other' => [
            'overview' => true,
            'contacts' => false,
            'careers' => false,
            'content' => false,
            'settings' => false,
            'users' => false,
            'health' => false,
        ],
        default => [
            'overview' => true,
            'contacts' => false,
            'careers' => false,
            'content' => false,
            'settings' => false,
            'users' => false,
            'health' => false,
        ],
    };
}

function normalize_permissions(mixed $permissions, string $role): array
{
    $defaults = default_role_permissions($role);

    if (!is_array($permissions)) {
        return $defaults;
    }

    foreach ($defaults as $key => $value) {
        if (array_key_exists($key, $permissions)) {
            $requested = normalize_bool($permissions[$key]) === 1;
            $defaults[$key] = $value ? $requested : false;
        }
    }

    return $defaults;
}

function default_store(): array
{
    $content = default_content_seed();
    foreach (content_types() as $type) {
        if (!isset($content[$type])) {
            $content[$type] = [];
        }
    }

    $submissions = [
        'contact' => [],
        'career' => [],
    ];

    return [
        'admins' => [[
            'id' => 1,
            'loginId' => env_value('ADMIN_DEFAULT_LOGIN', 'admin') ?? 'admin',
            'name' => env_value('ADMIN_DEFAULT_NAME', 'Admin') ?? 'Admin',
            'email' => env_value('ADMIN_DEFAULT_EMAIL', 'admin@example.com') ?? 'admin@example.com',
            'phone' => env_value('ADMIN_DEFAULT_PHONE', '') ?? '',
            'passwordHash' => password_hash(env_value('ADMIN_DEFAULT_PASSWORD', 'ChangeMe123!') ?? 'ChangeMe123!', PASSWORD_DEFAULT),
            'twoFactorEnabled' => true,
            'authenticatorEnabled' => false,
            'authenticatorSecret' => null,
            'authenticatorPeriodSeconds' => 30,
            'role' => 'admin',
            'permissions' => default_role_permissions('admin'),
            'isActive' => true,
            'mustChangePassword' => false,
            'createdAt' => now_utc(),
            'updatedAt' => now_utc(),
            'lastLoginAt' => null,
        ]],
        'settings' => default_site_settings(),
        'content' => $content,
        'submissions' => $submissions,
        'events' => [],
        'security' => [
            'rateLimits' => [],
            'blockedIps' => [],
            'auditLogs' => [],
            'sessions' => [],
        ],
        'migrations' => [],
    ];
}

function ensure_store_exists(): void
{
    if (!is_dir(data_dir())) {
        mkdir(data_dir(), 0777, true);
    }

    if (!file_exists(store_path())) {
        file_put_contents(
            store_path(),
            json_encode(default_store(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
        );
    }
}

function content_identity_key(array $item): string
{
    $type = strtolower(sanitize_text((string)($item['type'] ?? '')));
    $slug = strtolower(sanitize_text((string)($item['slug'] ?? '')));
    $title = strtolower(sanitize_text((string)($item['title'] ?? '')));

    return $type . '|' . ($slug !== '' ? $slug : $title);
}

function merge_missing_default_content_items(array $currentItems, array $defaultItems): array
{
    $merged = array_values($currentItems);
    $knownKeys = [];
    $maxId = 0;
    $maxSortOrder = 0;

    foreach ($merged as $item) {
        $key = content_identity_key(is_array($item) ? $item : []);
        if ($key !== '|') {
            $knownKeys[$key] = true;
        }
        $maxId = max($maxId, (int)($item['id'] ?? 0));
        $maxSortOrder = max($maxSortOrder, (int)($item['sortOrder'] ?? 0));
    }

    foreach ($defaultItems as $defaultItem) {
        if (!is_array($defaultItem)) {
            continue;
        }

        $key = content_identity_key($defaultItem);
        if ($key === '|' || isset($knownKeys[$key])) {
            continue;
        }

        $maxId++;
        $maxSortOrder++;
        $defaultItem['id'] = $maxId;
        $defaultItem['sortOrder'] = $maxSortOrder;
        $defaultItem['createdAt'] = (string)($defaultItem['createdAt'] ?? now_utc());
        $defaultItem['updatedAt'] = now_utc();
        $merged[] = $defaultItem;
        $knownKeys[$key] = true;
    }

    return $merged;
}

function read_store(): array
{
    ensure_store_exists();

    $raw = file_get_contents(store_path());
    $decoded = is_string($raw) ? json_decode($raw, true) : null;

    if (!is_array($decoded)) {
        $decoded = default_store();
        write_store($decoded);
        return $decoded;
    }

    $defaults = default_store();
    $shouldPersist = false;

    if (!isset($decoded['admins']) || !is_array($decoded['admins']) || $decoded['admins'] === []) {
        $decoded['admins'] = $defaults['admins'];
        $shouldPersist = true;
    } else {
        foreach ($decoded['admins'] as $index => $admin) {
            $role = sanitize_text((string)($admin['role'] ?? 'admin')) ?: 'admin';
            $normalizedAdmin = array_merge($defaults['admins'][0], $admin);
            $normalizedAdmin['role'] = $role;
            $normalizedAdmin['permissions'] = normalize_permissions($admin['permissions'] ?? [], $role);
            $normalizedAdmin['isActive'] = normalize_bool($admin['isActive'] ?? true) === 1;
            $normalizedAdmin['mustChangePassword'] = false;
            $normalizedAdmin['twoFactorEnabled'] = normalize_bool($admin['twoFactorEnabled'] ?? true) === 1;
            $normalizedAdmin['authenticatorEnabled'] = normalize_bool($admin['authenticatorEnabled'] ?? false) === 1;
            $normalizedAdmin['authenticatorSecret'] = $admin['authenticatorSecret'] ?? null;
            $normalizedAdmin['authenticatorPeriodSeconds'] = normalize_authenticator_period_seconds(
                $admin['authenticatorPeriodSeconds']
                    ?? $decoded['settings']['authenticator_period_seconds']
                    ?? $defaults['settings']['authenticator_period_seconds']
            );
            $decoded['admins'][$index] = $normalizedAdmin;

            if ($normalizedAdmin !== $admin) {
                $shouldPersist = true;
            }
        }
    }

    if (!isset($decoded['settings']) || !is_array($decoded['settings'])) {
        $decoded['settings'] = $defaults['settings'];
        $shouldPersist = true;
    } else {
        $mergedSettings = array_merge($defaults['settings'], $decoded['settings']);
        $mergedSettings['authenticator_period_seconds'] = normalize_authenticator_period_seconds(
            $mergedSettings['authenticator_period_seconds'] ?? $defaults['settings']['authenticator_period_seconds']
        );
        if ($mergedSettings !== $decoded['settings']) {
          $shouldPersist = true;
        }
        $decoded['settings'] = $mergedSettings;
    }

    if (!isset($decoded['content']) || !is_array($decoded['content'])) {
        $decoded['content'] = $defaults['content'];
        $shouldPersist = true;
    }

    foreach (content_types() as $type) {
        if (!isset($decoded['content'][$type]) || !is_array($decoded['content'][$type])) {
            $decoded['content'][$type] = [];
            $shouldPersist = true;
        }

        if ($decoded['content'][$type] === [] && ($defaults['content'][$type] ?? []) !== []) {
            $decoded['content'][$type] = $defaults['content'][$type];
            $shouldPersist = true;
        }
    }

    if (!isset($decoded['migrations']) || !is_array($decoded['migrations'])) {
        $decoded['migrations'] = [];
        $shouldPersist = true;
    }

    if (normalize_bool($decoded['migrations']['serviceProductsExpanded'] ?? false) !== 1) {
        $mergedItems = merge_missing_default_content_items(
            $decoded['content']['service_products'] ?? [],
            $defaults['content']['service_products'] ?? []
        );

        if ($mergedItems !== ($decoded['content']['service_products'] ?? [])) {
            $decoded['content']['service_products'] = $mergedItems;
        }

        $decoded['migrations']['serviceProductsExpanded'] = true;
        $shouldPersist = true;
    }

    if (!isset($decoded['submissions']) || !is_array($decoded['submissions'])) {
        $decoded['submissions'] = $defaults['submissions'];
        $shouldPersist = true;
    }

    foreach (['contact', 'career'] as $type) {
        if (!isset($decoded['submissions'][$type]) || !is_array($decoded['submissions'][$type])) {
            $decoded['submissions'][$type] = [];
            $shouldPersist = true;
        }
    }

    if (!isset($decoded['events']) || !is_array($decoded['events'])) {
        $decoded['events'] = [];
        $shouldPersist = true;
    }

    if (!isset($decoded['security']) || !is_array($decoded['security'])) {
        $decoded['security'] = $defaults['security'];
        $shouldPersist = true;
    }

    if (!isset($decoded['security']['rateLimits']) || !is_array($decoded['security']['rateLimits'])) {
        $decoded['security']['rateLimits'] = [];
        $shouldPersist = true;
    }

    if (!isset($decoded['security']['blockedIps']) || !is_array($decoded['security']['blockedIps'])) {
        $decoded['security']['blockedIps'] = [];
        $shouldPersist = true;
    }

    if (!isset($decoded['security']['auditLogs']) || !is_array($decoded['security']['auditLogs'])) {
        $decoded['security']['auditLogs'] = [];
        $shouldPersist = true;
    }

    if (!isset($decoded['security']['sessions']) || !is_array($decoded['security']['sessions'])) {
        $decoded['security']['sessions'] = [];
        $shouldPersist = true;
    } else {
        $normalizedSessions = array_map('normalize_admin_session_record', $decoded['security']['sessions']);
        if ($normalizedSessions !== $decoded['security']['sessions']) {
            $decoded['security']['sessions'] = $normalizedSessions;
            $shouldPersist = true;
        }
    }

    if ($shouldPersist) {
        write_store($decoded);
    }

    return $decoded;
}

function write_store(array $store): void
{
    ensure_store_exists();
    file_put_contents(
        store_path(),
        json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
}

function rate_limit_key(string $bucket, string $identifier): string
{
    return hash_identifier($bucket . '|' . $identifier);
}

function enforce_rate_limit(
    string $bucket,
    string $identifier,
    int $maxAttempts,
    int $windowSeconds,
    string $message = 'Too many requests. Please wait and try again.'
): void {
    $store = read_store();
    $now = time();
    $key = rate_limit_key($bucket, $identifier);
    $entry = $store['security']['rateLimits'][$key] ?? [
        'bucket' => $bucket,
        'count' => 0,
        'windowStartedAt' => $now,
        'blockedUntil' => 0,
    ];

    if (($entry['blockedUntil'] ?? 0) > $now) {
        json_response(['error' => $message], 429);
    }

    if (($entry['windowStartedAt'] ?? 0) + $windowSeconds <= $now) {
        $entry['count'] = 0;
        $entry['windowStartedAt'] = $now;
        $entry['blockedUntil'] = 0;
    }

    $entry['count'] = (int)($entry['count'] ?? 0) + 1;

    if ($entry['count'] > $maxAttempts) {
        $entry['blockedUntil'] = $now + $windowSeconds;
        $store['security']['rateLimits'][$key] = $entry;
        write_store($store);
        json_response(['error' => $message], 429);
    }

    $store['security']['rateLimits'][$key] = $entry;
    write_store($store);
}

function clear_rate_limit(string $bucket, string $identifier): void
{
    $store = read_store();
    $key = rate_limit_key($bucket, $identifier);

    if (!isset($store['security']['rateLimits'][$key])) {
        return;
    }

    unset($store['security']['rateLimits'][$key]);
    write_store($store);
}

function generate_totp_secret(int $length = 32): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $secret = '';

    for ($index = 0; $index < $length; $index++) {
        $secret .= $alphabet[random_int(0, strlen($alphabet) - 1)];
    }

    return $secret;
}

function normalize_totp_secret(string $secret): string
{
    return strtoupper(preg_replace('/[^A-Z2-7]/', '', $secret) ?? '');
}

function decode_base32_secret(string $secret): string
{
    $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $normalized = normalize_totp_secret($secret);

    if ($normalized === '') {
        return '';
    }

    $bits = '';
    $length = strlen($normalized);

    for ($index = 0; $index < $length; $index++) {
        $position = strpos($alphabet, $normalized[$index]);
        if ($position === false) {
            return '';
        }

        $bits .= str_pad(decbin($position), 5, '0', STR_PAD_LEFT);
    }

    $output = '';
    $bitLength = strlen($bits);

    for ($offset = 0; $offset + 8 <= $bitLength; $offset += 8) {
        $output .= chr(bindec(substr($bits, $offset, 8)));
    }

    return $output;
}

function totp_code_for_secret(string $secret, ?int $timestamp = null, int $periodSeconds = 30): string
{
    $decoded = decode_base32_secret($secret);
    if ($decoded === '') {
        return '';
    }

    $time = $timestamp ?? time();
    $periodSeconds = normalize_authenticator_period_seconds($periodSeconds);
    $counter = (int)floor($time / $periodSeconds);
    $binaryCounter = pack('N*', 0) . pack('N*', $counter);
    $hash = hash_hmac('sha1', $binaryCounter, $decoded, true);
    $offset = ord(substr($hash, -1)) & 0x0F;
    $slice = substr($hash, $offset, 4);
    $value = unpack('N', $slice);
    $truncated = ((int)($value[1] ?? 0)) & 0x7FFFFFFF;

    return str_pad((string)($truncated % 1000000), 6, '0', STR_PAD_LEFT);
}

function verify_totp_secret_code(string $secret, string $code, int $window = 1, int $periodSeconds = 30): bool
{
    $normalizedCode = preg_replace('/\D/', '', $code) ?? '';
    if (strlen($normalizedCode) !== 6) {
        return false;
    }

    $current = time();
    $periodSeconds = normalize_authenticator_period_seconds($periodSeconds);
    for ($offset = -$window; $offset <= $window; $offset++) {
        if (hash_equals(totp_code_for_secret($secret, $current + ($offset * $periodSeconds), $periodSeconds), $normalizedCode)) {
            return true;
        }
    }

    return false;
}

function admin_totp_secret(array $admin): string
{
    return decrypt_sensitive_value((string)($admin['authenticatorSecret'] ?? ''));
}

function admin_totp_period(array $admin): int
{
    return normalize_authenticator_period_seconds($admin['authenticatorPeriodSeconds'] ?? 30);
}

function totp_account_label(array $admin): string
{
    $issuer = settings_payload(false)['site_name'] ?: 'Master Qatar Admin';
    $identity = sanitize_text((string)($admin['email'] ?? $admin['loginId'] ?? 'admin'));
    return $issuer . ':' . $identity;
}

function otpauth_uri_for_admin(array $admin, string $secret, ?int $periodSeconds = null): string
{
    $issuer = settings_payload(false)['site_name'] ?: 'Master Qatar Admin';
    $periodSeconds = normalize_authenticator_period_seconds($periodSeconds ?? admin_totp_period($admin));

    return sprintf(
        'otpauth://totp/%s?secret=%s&issuer=%s&algorithm=SHA1&digits=6&period=%d',
        rawurlencode(totp_account_label($admin)),
        rawurlencode($secret),
        rawurlencode($issuer),
        $periodSeconds
    );
}

function current_totp_setup(): ?array
{
    $setup = $_SESSION['totp_setup'] ?? null;
    if (!is_array($setup)) {
        return null;
    }

    if ((int)($setup['expiresAt'] ?? 0) < time()) {
        unset($_SESSION['totp_setup']);
        return null;
    }

    return $setup;
}

function create_totp_challenge(string $purpose, int $adminId, array $payload = []): array
{
    $admin = find_admin_by_id(read_store(), $adminId);
    if ($admin === null) {
        json_response(['error' => 'Admin account not found.'], 404);
    }

    $challenge = [
        'purpose' => $purpose,
        'method' => 'authenticator',
        'adminId' => $adminId,
        'expiresAt' => time() + 600,
        'emailMasked' => null,
        'payload' => $payload,
        'attemptsRemaining' => 5,
        'clientHash' => current_request_fingerprint(),
        'createdAt' => now_utc(),
    ];

    $_SESSION['otp_challenge'] = $challenge;
    return $challenge;
}

function create_totp_login_challenge(int $adminId): array
{
    return create_totp_challenge('login', $adminId);
}

function secondary_factor_email_available(array $admin): bool
{
    return is_valid_email((string)($admin['email'] ?? ''));
}

function secondary_factor_method(array $admin, string $purpose = 'login'): string
{
    $authenticatorEnabled = normalize_bool($admin['authenticatorEnabled'] ?? false) === 1
        && admin_totp_secret($admin) !== '';
    $emailAvailable = secondary_factor_email_available($admin);

    if ($purpose === 'login') {
        $settings = settings_payload(false);
        $emailOtpEnabled = $authenticatorEnabled
            ? $emailAvailable
            : (
                $emailAvailable
                && (
                    (bool)($settings['two_factor_auth_enabled'] ?? false)
                    || normalize_bool($admin['twoFactorEnabled'] ?? true) === 1
                )
            );

        if ($authenticatorEnabled && $emailOtpEnabled) {
            return 'email_or_authenticator';
        }

        if ($authenticatorEnabled) {
            return 'authenticator';
        }

        if ($emailOtpEnabled) {
            return 'email';
        }

        return 'none';
    }

    if ($authenticatorEnabled && $emailAvailable) {
        return 'email_or_authenticator';
    }

    if ($authenticatorEnabled) {
        return 'authenticator';
    }

    return $emailAvailable ? 'email' : 'none';
}

function create_secondary_factor_challenge(string $purpose, int $adminId, array $payload = []): array
{
    $admin = find_admin_by_id(read_store(), $adminId);
    if ($admin === null) {
        json_response(['error' => 'Admin account not found.'], 404);
    }

    $method = secondary_factor_method($admin, $purpose);

    return match ($method) {
        'authenticator' => create_totp_challenge($purpose, $adminId, $payload),
        'email_or_authenticator' => create_otp_challenge(
            $purpose,
            $adminId,
            $payload,
            'email_or_authenticator',
            true
        ),
        'email' => create_otp_challenge($purpose, $adminId, $payload),
        default => json_response(
            ['error' => 'No verification method is available for this admin account. Update the admin email or authenticator settings first.'],
            422
        ),
    };
}

function clear_login_lockouts(?string $loginId, ?string $requestFingerprint, ?array $actor = null): array
{
    $normalizedLoginId = strtolower(sanitize_text($loginId ?? ''));
    $normalizedFingerprint = sanitize_text($requestFingerprint ?? '');

    if ($normalizedLoginId !== '') {
        clear_rate_limit('admin_login_user', $normalizedLoginId);
        clear_rate_limit('password_reset_request_login', $normalizedLoginId);
    }

    if ($normalizedFingerprint !== '') {
        clear_rate_limit('admin_login_ip', $normalizedFingerprint);
        clear_rate_limit('password_reset_request_ip', $normalizedFingerprint);
    }

    return write_audit_log(
        'security.clear_login_lock',
        'Cleared login lockouts for an admin account.',
        'info',
        [
            'loginId' => $normalizedLoginId,
            'requestFingerprint' => $normalizedFingerprint,
        ],
        $actor
    );
}

function security_alert_email(): string
{
    $settings = settings_payload(false);
    return sanitize_text((string)($settings['security_alert_email'] ?? $settings['primary_email'] ?? ''));
}

function normalize_authenticator_period_seconds(mixed $value): int
{
    $period = (int)$value;
    $allowed = [15, 30, 60, 90, 120];

    return in_array($period, $allowed, true) ? $period : 30;
}

function admin_role_env_suffix(string $role): string
{
    $normalized = strtoupper(preg_replace('/[^A-Z0-9]+/', '_', sanitize_text($role)) ?? '');
    return $normalized !== '' ? $normalized : 'OTHER';
}

function is_valid_ip_or_cidr(string $candidate): bool
{
    $value = sanitize_text($candidate);
    if ($value === '') {
        return false;
    }

    if (!str_contains($value, '/')) {
        return filter_var($value, FILTER_VALIDATE_IP) !== false;
    }

    [$ip, $prefix] = explode('/', $value, 2);
    $ip = sanitize_text($ip);
    $prefix = trim($prefix);

    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false) {
        return ctype_digit($prefix) && (int)$prefix >= 0 && (int)$prefix <= 32;
    }

    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false) {
        return ctype_digit($prefix) && (int)$prefix >= 0 && (int)$prefix <= 128;
    }

    return false;
}

function parse_ip_allowlist_value(?string $value): array
{
    if (!is_string($value) || trim($value) === '') {
        return [];
    }

    $tokens = preg_split('/[\s,;]+/', trim($value)) ?: [];
    $rules = [];

    foreach ($tokens as $token) {
        $rule = sanitize_text($token);
        if ($rule === '' || !is_valid_ip_or_cidr($rule)) {
            continue;
        }

        if (!in_array($rule, $rules, true)) {
            $rules[] = $rule;
        }
    }

    return $rules;
}

function admin_env_ip_rules(string $key): array
{
    return parse_ip_allowlist_value(env_value($key, ''));
}

function admin_global_ip_rules(): array
{
    return admin_env_ip_rules('ADMIN_ALLOWED_IPS');
}

function admin_role_ip_rules(string $role): array
{
    return admin_env_ip_rules('ADMIN_ALLOWED_IPS_' . admin_role_env_suffix($role));
}

function admin_login_surface_ip_rules(): array
{
    $roles = ['admin', 'ceo', 'hr', 'md', 'staff', 'other'];
    $rules = admin_global_ip_rules();

    foreach ($roles as $role) {
        foreach (admin_role_ip_rules($role) as $rule) {
            if (!in_array($rule, $rules, true)) {
                $rules[] = $rule;
            }
        }
    }

    return $rules;
}

function ip_matches_rule(string $ipAddress, string $rule): bool
{
    $ipAddress = sanitize_text($ipAddress);
    $rule = sanitize_text($rule);

    if ($ipAddress === '' || $rule === '') {
        return false;
    }

    if (!str_contains($rule, '/')) {
        return $ipAddress === $rule;
    }

    [$network, $prefixText] = explode('/', $rule, 2);
    $ipBinary = @inet_pton($ipAddress);
    $networkBinary = @inet_pton($network);

    if ($ipBinary === false || $networkBinary === false || strlen($ipBinary) !== strlen($networkBinary)) {
        return false;
    }

    $prefix = (int)$prefixText;
    $fullBytes = intdiv($prefix, 8);
    $remainingBits = $prefix % 8;

    if ($fullBytes > 0 && substr($ipBinary, 0, $fullBytes) !== substr($networkBinary, 0, $fullBytes)) {
        return false;
    }

    if ($remainingBits === 0) {
        return true;
    }

    $mask = (0xFF << (8 - $remainingBits)) & 0xFF;
    $ipByte = ord($ipBinary[$fullBytes]);
    $networkByte = ord($networkBinary[$fullBytes]);

    return ($ipByte & $mask) === ($networkByte & $mask);
}

function ip_matches_any_rule(string $ipAddress, array $rules): bool
{
    if ($rules === []) {
        return true;
    }

    foreach ($rules as $rule) {
        if (ip_matches_rule($ipAddress, (string)$rule)) {
            return true;
        }
    }

    return false;
}

function is_admin_ip_allowed(?array $admin = null, ?string $ipAddress = null): bool
{
    $clientIp = sanitize_text($ipAddress ?? client_ip_address()) ?: '0.0.0.0';
    $rules = $admin === null
        ? admin_login_surface_ip_rules()
        : array_values(array_unique(array_merge(
            admin_global_ip_rules(),
            admin_role_ip_rules((string)($admin['role'] ?? 'other'))
        )));

    return ip_matches_any_rule($clientIp, $rules);
}

function deny_hidden_admin_access(string $context, ?array $admin = null): void
{
    if ($admin !== null) {
        close_current_admin_session('inactive', 'Access denied by IP policy.');
    }
    clear_auth_flow();
    write_audit_log(
        'security.admin_access_hidden',
        'Hidden admin access denied by IP policy.',
        'warning',
        [
            'context' => $context,
            'role' => $admin['role'] ?? null,
            'loginId' => $admin['loginId'] ?? null,
            'ipAddress' => client_ip_address(),
        ],
        $admin,
        true
    );
    json_response(['error' => 'Page not found.'], 404);
}

function enforce_admin_login_surface_access(string $context = 'admin_surface'): void
{
    $rules = admin_login_surface_ip_rules();
    if ($rules === []) {
        return;
    }

    if (!ip_matches_any_rule(client_ip_address(), $rules)) {
        deny_hidden_admin_access($context, null);
    }
}

function enforce_admin_ip_access(array $admin, string $context = 'admin_panel'): void
{
    if (!is_admin_ip_allowed($admin)) {
        deny_hidden_admin_access($context, $admin);
    }
}

function normalize_audit_log(array $entry): array
{
    return [
        'id' => (int)($entry['id'] ?? 0),
        'type' => (string)($entry['type'] ?? 'event'),
        'severity' => (string)($entry['severity'] ?? 'info'),
        'message' => (string)($entry['message'] ?? ''),
        'actorId' => isset($entry['actorId']) ? (int)$entry['actorId'] : null,
        'actorName' => $entry['actorName'] ?? null,
        'actorLoginId' => $entry['actorLoginId'] ?? null,
        'actorRole' => $entry['actorRole'] ?? null,
        'ipAddress' => (string)($entry['ipAddress'] ?? ''),
        'ipHash' => (string)($entry['ipHash'] ?? ''),
        'browser' => (string)($entry['browser'] ?? current_browser_name()),
        'deviceType' => (string)($entry['deviceType'] ?? current_device_type()),
        'locationHint' => $entry['locationHint'] ?? null,
        'details' => decode_metadata($entry['details'] ?? []),
        'createdAt' => (string)($entry['createdAt'] ?? now_utc()),
        'blocked' => normalize_bool($entry['blocked'] ?? false) === 1,
    ];
}

function normalize_admin_session_record(array $record): array
{
    $status = sanitize_text((string)($record['status'] ?? 'active')) ?: 'active';
    if (!in_array($status, ['active', 'logged_out', 'inactive'], true)) {
        $status = 'inactive';
    }

    return [
        'id' => (int)($record['id'] ?? 0),
        'sessionKey' => (string)($record['sessionKey'] ?? ''),
        'adminId' => isset($record['adminId']) ? (int)$record['adminId'] : null,
        'actorName' => $record['actorName'] ?? null,
        'actorLoginId' => $record['actorLoginId'] ?? null,
        'actorRole' => $record['actorRole'] ?? null,
        'ipAddress' => (string)($record['ipAddress'] ?? ''),
        'ipHash' => (string)($record['ipHash'] ?? ''),
        'browser' => (string)($record['browser'] ?? current_browser_name()),
        'deviceType' => (string)($record['deviceType'] ?? current_device_type()),
        'locationHint' => $record['locationHint'] ?? request_location_hint(),
        'requestFingerprint' => (string)($record['requestFingerprint'] ?? ''),
        'loginAt' => (string)($record['loginAt'] ?? now_utc()),
        'lastSeenAt' => (string)($record['lastSeenAt'] ?? ($record['loginAt'] ?? now_utc())),
        'endedAt' => $record['endedAt'] ?? null,
        'status' => $status,
        'endedReason' => $record['endedReason'] ?? null,
    ];
}

function public_admin_session_record(array $record): array
{
    $normalized = normalize_admin_session_record($record);
    unset($normalized['sessionKey'], $normalized['ipHash']);
    return $normalized;
}

function request_location_hint(): ?string
{
    $country = sanitize_text((string)($_SERVER['HTTP_CF_IPCOUNTRY'] ?? $_SERVER['HTTP_X_COUNTRY_CODE'] ?? ''));
    return $country !== '' ? $country : null;
}

function write_audit_log(
    string $type,
    string $message,
    string $severity = 'info',
    array $details = [],
    ?array $actor = null,
    bool $sendAlert = false
): array {
    $store = read_store();
    $logs = $store['security']['auditLogs'] ?? [];
    $actorId = is_array($actor) ? ($actor['id'] ?? null) : null;
    $actorName = is_array($actor) ? ($actor['name'] ?? null) : null;
    $actorLoginId = is_array($actor) ? ($actor['loginId'] ?? null) : null;
    $actorRole = is_array($actor) ? ($actor['role'] ?? null) : null;
    $entry = normalize_audit_log([
        'id' => next_id($logs),
        'type' => $type,
        'severity' => $severity,
        'message' => $message,
        'actorId' => $actorId,
        'actorName' => $actorName,
        'actorLoginId' => $actorLoginId,
        'actorRole' => $actorRole,
        'ipAddress' => client_ip_address(),
        'ipHash' => hash_identifier(client_ip_address()),
        'browser' => current_browser_name(),
        'deviceType' => current_device_type(),
        'locationHint' => request_location_hint(),
        'details' => $details,
        'createdAt' => now_utc(),
        'blocked' => normalize_bool($details['blocked'] ?? false) === 1,
    ]);

    $logs[] = $entry;
    $store['security']['auditLogs'] = array_slice($logs, -500);
    write_store($store);

    if ($sendAlert) {
        $to = security_alert_email();
        if ($to !== '') {
            send_transactional_email([
                'to' => [$to],
                'fromEmail' => settings_payload(false)['mail_from_email'] ?: env_value('SMTP_FROM_EMAIL', '') ?? '',
                'fromName' => settings_payload(false)['mail_from_name'] ?: settings_payload(false)['site_name'],
                'subject' => 'Security alert: ' . $message,
                'text' => mail_message_text('Security alert', [
                    'Event: ' . $type,
                    'Message: ' . $message,
                    'IP address: ' . client_ip_address(),
                    'Browser: ' . current_browser_name(),
                    'Device: ' . current_device_type(),
                    'Location: ' . (request_location_hint() ?? 'Unavailable'),
                ]),
                'html' => mail_message_html('Security alert', [
                    'Event' => $type,
                    'Message' => $message,
                    'IP address' => client_ip_address(),
                    'Browser' => current_browser_name(),
                    'Device' => current_device_type(),
                    'Location' => request_location_hint() ?? 'Unavailable',
                ]),
            ]);
        }
    }

    return $entry;
}

function admin_session_records(?array $store = null): array
{
    $store = $store ?? read_store();
    $sessions = $store['security']['sessions'] ?? [];
    $sessions = array_map('normalize_admin_session_record', is_array($sessions) ? $sessions : []);

    usort($sessions, static function (array $left, array $right): int {
        $leftTime = (string)($left['loginAt'] ?? '');
        $rightTime = (string)($right['loginAt'] ?? '');
        return strcmp($rightTime, $leftTime);
    });

    return $sessions;
}

function current_admin_session_key(): string
{
    return sanitize_text((string)($_SESSION['admin_session_key'] ?? ''));
}

function find_session_index_by_key(array $store, string $sessionKey): ?int
{
    foreach (($store['security']['sessions'] ?? []) as $index => $session) {
        if ((string)($session['sessionKey'] ?? '') === $sessionKey) {
            return $index;
        }
    }

    return null;
}

function generate_admin_session_key(): string
{
    try {
        return bin2hex(random_bytes(24));
    } catch (\Throwable) {
        return hash_identifier(uniqid('admin_session_', true) . '|' . microtime(true));
    }
}

function create_admin_session_record(array $admin): array
{
    $store = read_store();
    $sessions = $store['security']['sessions'] ?? [];
    $sessionKey = generate_admin_session_key();
    $now = now_utc();
    $record = normalize_admin_session_record([
        'id' => next_id(is_array($sessions) ? $sessions : []),
        'sessionKey' => $sessionKey,
        'adminId' => (int)($admin['id'] ?? 0),
        'actorName' => $admin['name'] ?? null,
        'actorLoginId' => $admin['loginId'] ?? null,
        'actorRole' => $admin['role'] ?? null,
        'ipAddress' => client_ip_address(),
        'ipHash' => hash_identifier(client_ip_address()),
        'browser' => current_browser_name(),
        'deviceType' => current_device_type(),
        'locationHint' => request_location_hint(),
        'requestFingerprint' => current_request_fingerprint(),
        'loginAt' => $now,
        'lastSeenAt' => $now,
        'endedAt' => null,
        'status' => 'active',
        'endedReason' => null,
    ]);

    $sessions[] = $record;
    $store['security']['sessions'] = array_slice($sessions, -1000);
    write_store($store);

    $_SESSION['admin_session_key'] = $sessionKey;

    return $record;
}

function touch_current_admin_session(array $admin): void
{
    $sessionKey = current_admin_session_key();
    if ($sessionKey === '') {
        create_admin_session_record($admin);
        return;
    }

    $store = read_store();
    $index = find_session_index_by_key($store, $sessionKey);
    if ($index === null) {
        create_admin_session_record($admin);
        return;
    }

    $current = normalize_admin_session_record($store['security']['sessions'][$index]);
    $lastSeenTimestamp = strtotime((string)($current['lastSeenAt'] ?? '')) ?: 0;
    $shouldWrite = $current['status'] !== 'active'
        || (time() - $lastSeenTimestamp) >= 60
        || (string)($current['ipAddress'] ?? '') !== client_ip_address()
        || (string)($current['browser'] ?? '') !== current_browser_name()
        || (string)($current['deviceType'] ?? '') !== current_device_type();

    if (!$shouldWrite) {
        return;
    }

    $store['security']['sessions'][$index]['actorName'] = $admin['name'] ?? $current['actorName'];
    $store['security']['sessions'][$index]['actorLoginId'] = $admin['loginId'] ?? $current['actorLoginId'];
    $store['security']['sessions'][$index]['actorRole'] = $admin['role'] ?? $current['actorRole'];
    $store['security']['sessions'][$index]['ipAddress'] = client_ip_address();
    $store['security']['sessions'][$index]['ipHash'] = hash_identifier(client_ip_address());
    $store['security']['sessions'][$index]['browser'] = current_browser_name();
    $store['security']['sessions'][$index]['deviceType'] = current_device_type();
    $store['security']['sessions'][$index]['locationHint'] = request_location_hint();
    $store['security']['sessions'][$index]['requestFingerprint'] = current_request_fingerprint();
    $store['security']['sessions'][$index]['lastSeenAt'] = now_utc();
    $store['security']['sessions'][$index]['status'] = 'active';
    $store['security']['sessions'][$index]['endedAt'] = null;
    $store['security']['sessions'][$index]['endedReason'] = null;
    write_store($store);
}

function close_current_admin_session(string $status = 'logged_out', ?string $reason = null): void
{
    $sessionKey = current_admin_session_key();
    if ($sessionKey === '') {
        return;
    }

    $store = read_store();
    $index = find_session_index_by_key($store, $sessionKey);
    if ($index === null) {
        return;
    }

    $now = now_utc();
    $store['security']['sessions'][$index]['lastSeenAt'] = $now;
    $store['security']['sessions'][$index]['endedAt'] = $now;
    $store['security']['sessions'][$index]['status'] = in_array($status, ['active', 'logged_out', 'inactive'], true)
        ? $status
        : 'inactive';
    $store['security']['sessions'][$index]['endedReason'] = $reason;
    write_store($store);
}

function blocked_ip_list(array $store): array
{
    $blockedIps = $store['security']['blockedIps'] ?? [];
    return is_array($blockedIps) ? $blockedIps : [];
}

function is_ip_blocked(string $ipAddress): bool
{
    $store = read_store();
    return in_array($ipAddress, blocked_ip_list($store), true);
}

function block_ip_address(string $ipAddress, ?array $actor = null): array
{
    $store = read_store();
    $blockedIps = blocked_ip_list($store);

    if (!in_array($ipAddress, $blockedIps, true)) {
        $blockedIps[] = $ipAddress;
        $store['security']['blockedIps'] = array_values($blockedIps);
        write_store($store);
    }

    return write_audit_log(
        'security.block_ip',
        'Blocked client IP address.',
        'warning',
        ['ipAddress' => $ipAddress, 'blocked' => true],
        $actor,
        true
    );
}

function unblock_ip_address(string $ipAddress, ?array $actor = null): array
{
    $store = read_store();
    $store['security']['blockedIps'] = array_values(array_filter(
        blocked_ip_list($store),
        static fn(string $item): bool => $item !== $ipAddress
    ));
    write_store($store);

    return write_audit_log(
        'security.unblock_ip',
        'Unblocked client IP address.',
        'info',
        ['ipAddress' => $ipAddress],
        $actor
    );
}

function enforce_blocked_client_policy(): void
{
    $ipAddress = client_ip_address();

    if ($ipAddress === '' || !is_ip_blocked($ipAddress)) {
        return;
    }

    write_audit_log(
        'security.blocked_request',
        'Blocked request from a blocked IP address.',
        'warning',
        ['ipAddress' => $ipAddress, 'blocked' => true]
    );

    json_response(['error' => 'Access from this client has been blocked.'], 403);
}

function next_id(array $items): int
{
    $maxId = 0;
    foreach ($items as $item) {
        $maxId = max($maxId, (int)($item['id'] ?? 0));
    }
    return $maxId + 1;
}

function is_primary_admin(array $admin): bool
{
    return ((string)($admin['role'] ?? '')) === 'admin';
}

function can_admin_access(array $admin, string $permission): bool
{
    $permissions = normalize_permissions($admin['permissions'] ?? [], (string)($admin['role'] ?? 'other'));
    return ($permissions[$permission] ?? false) === true;
}

function require_admin_permission(string $permission): array
{
    $admin = require_authenticated_admin();

    if (!can_admin_access($admin, $permission)) {
        json_response(['error' => 'You do not have permission to access this area.'], 403);
    }

    return $admin;
}

function public_admin(array $admin): array
{
    $role = (string)($admin['role'] ?? 'other');

    return [
        'id' => (int)$admin['id'],
        'loginId' => (string)$admin['loginId'],
        'email' => (string)$admin['email'],
        'phone' => (string)($admin['phone'] ?? ''),
        'name' => (string)($admin['name'] ?? 'Admin'),
        'role' => $role,
        'permissions' => normalize_permissions($admin['permissions'] ?? [], $role),
        'isActive' => normalize_bool($admin['isActive'] ?? true) === 1,
        'twoFactorEnabled' => normalize_bool($admin['twoFactorEnabled'] ?? true) === 1,
        'authenticatorEnabled' => normalize_bool($admin['authenticatorEnabled'] ?? false) === 1,
        'authenticatorPeriodSeconds' => normalize_authenticator_period_seconds($admin['authenticatorPeriodSeconds'] ?? 30),
        'lastLoginAt' => $admin['lastLoginAt'] ?? null,
        'mustChangePassword' => false,
    ];
}

function find_admin_by_login(array $store, string $loginId): ?array
{
    foreach ($store['admins'] as $admin) {
        if (strcasecmp((string)$admin['loginId'], $loginId) === 0) {
            return $admin;
        }
    }
    return null;
}

function find_admin_by_id(array $store, int $adminId): ?array
{
    foreach ($store['admins'] as $admin) {
        if ((int)$admin['id'] === $adminId) {
            return $admin;
        }
    }
    return null;
}

function find_admin_index_by_id(array $store, int $adminId): ?int
{
    foreach ($store['admins'] as $index => $admin) {
        if ((int)$admin['id'] === $adminId) {
            return $index;
        }
    }
    return null;
}

function create_admin_user(array $payload, array $actor): array
{
    $store = read_store();
    $role = sanitize_text((string)($payload['role'] ?? 'staff')) ?: 'staff';
    $loginId = sanitize_text((string)($payload['loginId'] ?? ''));
    $name = sanitize_text((string)($payload['name'] ?? ''));
    $email = sanitize_text((string)($payload['email'] ?? ''));
    $phone = sanitize_text((string)($payload['phone'] ?? ''));
    $providedPassword = (string)($payload['password'] ?? '');
    $twoFactorEnabled = normalize_bool($payload['twoFactorEnabled'] ?? true) === 1;

    if ($loginId === '' || $name === '' || $email === '') {
        json_response(['error' => 'Name, login ID, and email are required.'], 422);
    }

    if (!is_valid_email($email)) {
        json_response(['error' => 'A valid email address is required.'], 422);
    }

    foreach ($store['admins'] as $existingAdmin) {
        if (strcasecmp((string)$existingAdmin['loginId'], $loginId) === 0) {
            json_response(['error' => 'That login ID is already in use.'], 422);
        }

        if (strcasecmp((string)$existingAdmin['email'], $email) === 0) {
            json_response(['error' => 'That email address is already in use.'], 422);
        }
    }

    if ($providedPassword === '') {
        json_response(['error' => 'A password is required when creating a user.'], 422);
    }

    $passwordError = password_strength_error($providedPassword);

    if ($passwordError !== null) {
        json_response(['error' => $passwordError], 422);
    }

    $user = [
        'id' => next_id($store['admins']),
        'loginId' => $loginId,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'passwordHash' => password_hash($providedPassword, PASSWORD_DEFAULT),
        'twoFactorEnabled' => $twoFactorEnabled,
        'authenticatorEnabled' => false,
        'authenticatorSecret' => null,
        'authenticatorPeriodSeconds' => normalize_authenticator_period_seconds(settings_payload(false)['authenticator_period_seconds'] ?? 30),
        'role' => $role,
        'permissions' => normalize_permissions($payload['permissions'] ?? [], $role),
        'isActive' => true,
        'mustChangePassword' => false,
        'createdAt' => now_utc(),
        'updatedAt' => now_utc(),
        'lastLoginAt' => null,
    ];

    $store['admins'][] = $user;
    write_store($store);

    send_transactional_email([
        'to' => [$email],
        'fromEmail' => settings_payload(false)['mail_from_email'] ?: env_value('SMTP_FROM_EMAIL', '') ?? '',
        'fromName' => settings_payload(false)['mail_from_name'] ?: settings_payload(false)['site_name'],
        'subject' => 'Your admin panel access has been created',
        'text' => mail_message_text('Your admin panel access has been created', [
            'Login ID: ' . $loginId,
            'Role: ' . strtoupper($role),
            'Your administrator created access for you using the credentials assigned during setup.',
        ]),
        'html' => mail_message_html('Your admin panel access has been created', [
            'Login ID' => $loginId,
            'Role' => strtoupper($role),
            'Action' => 'Use the credentials assigned by your administrator to sign in.',
        ]),
    ]);

    write_audit_log(
        'admin.user_created',
        sprintf(
            'Created user %s (%s).',
            $name,
            $loginId
        ),
        'info',
        ['targetUser' => public_admin($user)],
        $actor
    );

    return [
        'user' => public_admin($user),
        'users' => list_admin_users(read_store()),
    ];
}

function update_admin_user(array $payload, array $actor): array
{
    $store = read_store();
    $id = (int)($payload['id'] ?? 0);
    $index = find_admin_index_by_id($store, $id);

    if ($index === null) {
        json_response(['error' => 'User not found.'], 404);
    }

    $current = $store['admins'][$index];
    $role = sanitize_text((string)($payload['role'] ?? ($current['role'] ?? 'staff'))) ?: 'staff';
    $loginId = sanitize_text((string)($payload['loginId'] ?? $current['loginId']));
    $name = sanitize_text((string)($payload['name'] ?? $current['name']));
    $email = sanitize_text((string)($payload['email'] ?? $current['email']));
    $phone = sanitize_text((string)($payload['phone'] ?? $current['phone'] ?? ''));
    $isActive = normalize_bool($payload['isActive'] ?? $current['isActive'] ?? true) === 1;
    $twoFactorEnabled = normalize_bool($payload['twoFactorEnabled'] ?? $current['twoFactorEnabled'] ?? true) === 1;

    if ($loginId === '' || $name === '' || $email === '') {
        json_response(['error' => 'Name, login ID, and email are required.'], 422);
    }

    if (!is_valid_email($email)) {
        json_response(['error' => 'A valid email address is required.'], 422);
    }

    foreach ($store['admins'] as $candidate) {
        if ((int)($candidate['id'] ?? 0) === $id) {
            continue;
        }

        if (strcasecmp((string)$candidate['loginId'], $loginId) === 0) {
            json_response(['error' => 'That login ID is already in use.'], 422);
        }

        if (strcasecmp((string)$candidate['email'], $email) === 0) {
            json_response(['error' => 'That email address is already in use.'], 422);
        }
    }

    $store['admins'][$index]['loginId'] = $loginId;
    $store['admins'][$index]['name'] = $name;
    $store['admins'][$index]['email'] = $email;
    $store['admins'][$index]['phone'] = $phone;
    $store['admins'][$index]['role'] = $role;
    $store['admins'][$index]['permissions'] = normalize_permissions($payload['permissions'] ?? [], $role);
    $store['admins'][$index]['isActive'] = $isActive;
    $store['admins'][$index]['twoFactorEnabled'] = $twoFactorEnabled;
    $store['admins'][$index]['updatedAt'] = now_utc();
    write_store($store);

    write_audit_log(
        'admin.user_updated',
        sprintf(
            'Updated user %s (%s).',
            $name,
            $loginId
        ),
        'info',
        ['targetUser' => public_admin($store['admins'][$index])],
        $actor
    );

    return [
        'user' => public_admin($store['admins'][$index]),
        'users' => list_admin_users(read_store()),
    ];
}

function delete_admin_user(int $id, array $actor): array
{
    $store = read_store();
    $index = find_admin_index_by_id($store, $id);

    if ($index === null) {
        json_response(['error' => 'User not found.'], 404);
    }

    if ((int)$store['admins'][$index]['id'] === (int)$actor['id']) {
        json_response(['error' => 'You cannot delete your own account.'], 422);
    }

    $deletedUser = public_admin($store['admins'][$index]);
    array_splice($store['admins'], $index, 1);
    write_store($store);

    write_audit_log(
        'admin.user_deleted',
        sprintf(
            'Deleted user %s (%s).',
            (string)($deletedUser['name'] ?? 'Unknown user'),
            (string)($deletedUser['loginId'] ?? 'unknown')
        ),
        'warning',
        ['targetUser' => $deletedUser],
        $actor,
        true
    );

    return list_admin_users(read_store());
}

function reset_admin_user_password(int $id, string $newPassword, array $actor): array
{
    $store = read_store();
    $index = find_admin_index_by_id($store, $id);

    if ($index === null) {
        json_response(['error' => 'User not found.'], 404);
    }

    $passwordError = password_strength_error($newPassword);
    if ($passwordError !== null) {
        json_response(['error' => $passwordError], 422);
    }

    $store['admins'][$index]['passwordHash'] = password_hash($newPassword, PASSWORD_DEFAULT);
    $store['admins'][$index]['mustChangePassword'] = false;
    $store['admins'][$index]['updatedAt'] = now_utc();
    write_store($store);

    $targetUser = $store['admins'][$index];

    send_transactional_email([
        'to' => [$targetUser['email']],
        'fromEmail' => settings_payload(false)['mail_from_email'] ?: env_value('SMTP_FROM_EMAIL', '') ?? '',
        'fromName' => settings_payload(false)['mail_from_name'] ?: settings_payload(false)['site_name'],
        'subject' => 'Your admin panel password was reset',
        'text' => mail_message_text('Your admin panel password was reset', [
            'Login ID: ' . $targetUser['loginId'],
            'Your administrator has set a new password for your account.',
            'Use the credentials shared by your administrator to sign in.',
        ]),
        'html' => mail_message_html('Your admin panel password was reset', [
            'Login ID' => $targetUser['loginId'],
            'Action' => 'Use the credentials shared by your administrator to sign in.',
        ]),
    ]);

    write_audit_log(
        'admin.user_password_reset',
        sprintf(
            'Reset password for %s (%s).',
            (string)($targetUser['name'] ?? 'Unknown user'),
            (string)($targetUser['loginId'] ?? 'unknown')
        ),
        'warning',
        ['targetUser' => public_admin($targetUser)],
        $actor,
        true
    );

    return [
        'users' => list_admin_users(read_store()),
    ];
}

function current_admin(): ?array
{
    $lastActiveAt = (int)($_SESSION['admin_last_active_at'] ?? 0);
    if ($lastActiveAt > 0 && (time() - $lastActiveAt) > 7200) {
        close_current_admin_session('inactive', 'Session expired after inactivity.');
        clear_auth_flow();
        return null;
    }

    $adminId = (int)($_SESSION['admin_id'] ?? 0);
    if ($adminId <= 0) {
        return null;
    }

    $_SESSION['admin_last_active_at'] = time();
    $admin = find_admin_by_id(read_store(), $adminId);

    if ($admin === null || normalize_bool($admin['isActive'] ?? true) !== 1) {
        close_current_admin_session('inactive', 'Account is no longer active.');
        clear_auth_flow();
        return null;
    }

    enforce_admin_ip_access($admin, 'authenticated_session');
    touch_current_admin_session($admin);

    return $admin;
}

function require_authenticated_admin(): array
{
    $admin = current_admin();
    if ($admin === null) {
        json_response(['error' => 'Authentication required.'], 401);
    }

    return $admin;
}

function clear_auth_flow(): void
{
    unset(
        $_SESSION['admin_id'],
        $_SESSION['admin_session_key'],
        $_SESSION['admin_last_active_at'],
        $_SESSION['otp_challenge'],
        $_SESSION['password_reset_verified']
    );
}

function mark_admin_authenticated(int $adminId): void
{
    session_regenerate_id(true);
    unset($_SESSION['otp_challenge'], $_SESSION['password_reset_verified']);
    $_SESSION['admin_id'] = $adminId;
    $_SESSION['admin_last_active_at'] = time();

    $admin = find_admin_by_id(read_store(), $adminId);
    if ($admin !== null) {
        create_admin_session_record($admin);
    }
}

function otp_purpose_title(string $purpose): string
{
    return match ($purpose) {
        'login' => 'Admin login verification',
        'password_change' => 'Password change verification',
        'password_reset' => 'Password reset verification',
        'user_password_reset' => 'Admin user password reset verification',
        'account_update' => 'Account update verification',
        default => 'Verification code',
    };
}

function create_otp_challenge(
    string $purpose,
    int $adminId,
    array $payload = [],
    string $method = 'email',
    bool $totpAllowed = false
): array
{
    $admin = find_admin_by_id(read_store(), $adminId);
    if ($admin === null) {
        json_response(['error' => 'Admin account not found.'], 404);
    }

    $configuredDevCode = sanitize_text(env_value('DEV_OTP_CODE', '') ?? '');
    $otpCode = $configuredDevCode !== '' ? $configuredDevCode : (string)random_int(100000, 999999);
    $settings = settings_payload(false);

    $challenge = [
        'purpose' => $purpose,
        'method' => $method,
        'adminId' => $adminId,
        'codeHash' => password_hash($otpCode, PASSWORD_DEFAULT),
        'expiresAt' => time() + 600,
        'emailMasked' => mask_email((string)$admin['email']),
        'payload' => $payload,
        'totpAllowed' => $totpAllowed,
        'attemptsRemaining' => 5,
        'clientHash' => current_request_fingerprint(),
        'createdAt' => now_utc(),
    ];

    $_SESSION['otp_challenge'] = $challenge;

    send_transactional_email([
        'to' => [(string)$admin['email']],
        'fromEmail' => $settings['mail_from_email'] ?: env_value('SMTP_FROM_EMAIL', '') ?? '',
        'fromName' => $settings['mail_from_name'] ?: $settings['site_name'],
        'subject' => otp_purpose_title($purpose),
        'text' => mail_message_text(otp_purpose_title($purpose), [
            'Your verification code is: ' . $otpCode,
            'It expires in 10 minutes.',
            'If you did not request this code, ignore this email and review your admin security settings.',
        ]),
        'html' => mail_message_html(otp_purpose_title($purpose), [
            'Verification code' => $otpCode,
            'Expires in' => '10 minutes',
            'Purpose' => otp_purpose_title($purpose),
        ]),
    ]);

    return $challenge;
}

function current_otp_challenge(?string $purpose = null): ?array
{
    $challenge = $_SESSION['otp_challenge'] ?? null;
    if (!is_array($challenge)) {
        return null;
    }

    if (($challenge['expiresAt'] ?? 0) < time()) {
        unset($_SESSION['otp_challenge']);
        return null;
    }

    if ($purpose !== null && ($challenge['purpose'] ?? '') !== $purpose) {
        return null;
    }

    $admin = find_admin_by_id(read_store(), (int)($challenge['adminId'] ?? 0));
    if ($admin !== null) {
        enforce_admin_ip_access($admin, 'otp_challenge');
    }

    return $challenge;
}

function verify_otp_challenge(string $purpose, string $otp): array
{
    $challenge = current_otp_challenge($purpose);
    $rateLimitIdentifier = current_request_fingerprint() . '|' . ($challenge['adminId'] ?? 'unknown');
    enforce_rate_limit(
        'otp:' . $purpose,
        $rateLimitIdentifier,
        8,
        600,
        'Too many verification attempts. Please wait and try again.'
    );

    if ($challenge === null) {
        json_response(['error' => 'Verification session expired. Please start again.'], 422);
    }

    if (($challenge['clientHash'] ?? '') !== current_request_fingerprint()) {
        unset($_SESSION['otp_challenge']);
        write_audit_log(
            'auth.otp.client_mismatch',
            'OTP verification attempted from a different client fingerprint.',
            'warning',
            ['purpose' => $purpose],
            find_admin_by_id(read_store(), (int)($challenge['adminId'] ?? 0)),
            true
        );
        json_response(['error' => 'Verification session is only valid from the same browser and network. Please start again.'], 422);
    }

    $method = (string)($challenge['method'] ?? 'email');
    $allowsEmail = in_array($method, ['email', 'email_or_authenticator'], true);
    $allowsAuthenticator = in_array($method, ['authenticator', 'totp', 'email_or_authenticator'], true)
        || normalize_bool($challenge['totpAllowed'] ?? false) === 1;
    $isValid = false;
    $verifiedWith = $allowsAuthenticator && !$allowsEmail ? 'authenticator' : 'email';

    if ($allowsEmail && password_verify($otp, (string)($challenge['codeHash'] ?? ''))) {
        $isValid = true;
        $verifiedWith = 'email';
    }

    if (!$isValid && $allowsAuthenticator) {
        $admin = find_admin_by_id(read_store(), (int)($challenge['adminId'] ?? 0));
        $secret = $admin !== null ? admin_totp_secret($admin) : '';
        $periodSeconds = $admin !== null ? admin_totp_period($admin) : 30;
        $isValid = $secret !== '' && verify_totp_secret_code($secret, $otp, 1, $periodSeconds);
        if ($isValid) {
            $verifiedWith = 'authenticator';
        }
    }

    if (!$isValid) {
        $remainingAttempts = max(0, (int)($challenge['attemptsRemaining'] ?? 0) - 1);
        write_audit_log(
            'auth.otp.invalid',
            'Invalid OTP entered.',
            $remainingAttempts <= 1 ? 'warning' : 'info',
            ['purpose' => $purpose, 'method' => $method, 'attemptsRemaining' => $remainingAttempts],
            find_admin_by_id(read_store(), (int)($challenge['adminId'] ?? 0)),
            $remainingAttempts <= 1
        );

        if ($remainingAttempts <= 0) {
            unset($_SESSION['otp_challenge']);
            json_response(['error' => 'Too many invalid verification attempts. Please request a new code.'], 429);
        }

        $challenge['attemptsRemaining'] = $remainingAttempts;
        $_SESSION['otp_challenge'] = $challenge;
        json_response(['error' => 'Invalid verification code. ' . $remainingAttempts . ' attempt(s) remaining.'], 422);
    }

    clear_rate_limit('otp:' . $purpose, $rateLimitIdentifier);
    unset($_SESSION['otp_challenge']);
    $challenge['verifiedWith'] = $verifiedWith;
    return $challenge;
}

function normalize_content_item(array $item): array
{
    return [
        'id' => (int)($item['id'] ?? 0),
        'type' => (string)($item['type'] ?? ''),
        'slug' => $item['slug'] ?? null,
        'title' => (string)($item['title'] ?? ''),
        'subtitle' => $item['subtitle'] ?? null,
        'description' => $item['description'] ?? null,
        'imageUrl' => $item['imageUrl'] ?? null,
        'ctaLabel' => $item['ctaLabel'] ?? null,
        'ctaUrl' => $item['ctaUrl'] ?? null,
        'metadata' => decode_metadata($item['metadata'] ?? []),
        'sortOrder' => (int)($item['sortOrder'] ?? 0),
        'isPublished' => (bool)($item['isPublished'] ?? false),
        'showOnHomePage' => (bool)($item['showOnHomePage'] ?? false),
        'createdAt' => (string)($item['createdAt'] ?? now_utc()),
        'updatedAt' => (string)($item['updatedAt'] ?? now_utc()),
    ];
}

function list_content_items(string $type, bool $publishedOnly = false): array
{
    $store = read_store();
    $items = $store['content'][$type] ?? [];
    $items = array_map('normalize_content_item', $items);

    if ($publishedOnly) {
        $items = array_values(array_filter($items, static fn(array $item): bool => $item['isPublished'] === true));
    }

    usort($items, static function (array $a, array $b): int {
        $sortCompare = $a['sortOrder'] <=> $b['sortOrder'];
        return $sortCompare !== 0 ? $sortCompare : strcmp($a['title'], $b['title']);
    });

    return $items;
}

function list_homepage_content_items(string $type): array
{
    $items = list_content_items($type, true);
    return array_values(array_filter(
        $items,
        static fn(array $item): bool => $item['showOnHomePage'] === true
    ));
}

function save_content_item(array $payload): array
{
    $type = sanitize_text($payload['type'] ?? '');
    $title = sanitize_text($payload['title'] ?? '');

    if (!in_array($type, content_types(), true)) {
        json_response(['error' => 'Invalid content type.'], 422);
    }

    if ($title === '') {
        json_response(['error' => 'Title is required.'], 422);
    }

    $store = read_store();
    $items = $store['content'][$type];
    $id = isset($payload['id']) ? (int)$payload['id'] : 0;
    $now = now_utc();

    $item = [
        'id' => $id > 0 ? $id : next_id($items),
        'type' => $type,
        'slug' => sanitize_text($payload['slug'] ?? '') ?: null,
        'title' => $title,
        'subtitle' => sanitize_text($payload['subtitle'] ?? '') ?: null,
        'description' => sanitize_text($payload['description'] ?? '') ?: null,
        'imageUrl' => sanitize_text($payload['imageUrl'] ?? '') ?: null,
        'ctaLabel' => sanitize_text($payload['ctaLabel'] ?? '') ?: null,
        'ctaUrl' => sanitize_text($payload['ctaUrl'] ?? '') ?: null,
        'metadata' => decode_metadata($payload['metadata'] ?? []),
        'sortOrder' => (int)($payload['sortOrder'] ?? 0),
        'isPublished' => normalize_bool($payload['isPublished'] ?? false) === 1,
        'showOnHomePage' => normalize_bool($payload['showOnHomePage'] ?? false) === 1,
        'createdAt' => $now,
        'updatedAt' => $now,
    ];

    $updated = false;
    foreach ($items as $index => $existing) {
        if ((int)($existing['id'] ?? 0) === $item['id']) {
            $item['createdAt'] = (string)($existing['createdAt'] ?? $now);
            $items[$index] = $item;
            $updated = true;
            break;
        }
    }

    if (!$updated) {
        $items[] = $item;
    }

    $store['content'][$type] = $items;
    write_store($store);

    return normalize_content_item($item);
}

function delete_content_item(string $type, int $id): array
{
    if (!in_array($type, content_types(), true)) {
        json_response(['error' => 'Invalid content type.'], 422);
    }

    $store = read_store();
    $store['content'][$type] = array_values(array_filter(
        $store['content'][$type] ?? [],
        static fn(array $item): bool => (int)($item['id'] ?? 0) !== $id
    ));
    write_store($store);

    return list_content_items($type, false);
}

function settings_payload(bool $public = false): array
{
    $store = read_store();
    $settings = array_merge(default_site_settings(), $store['settings'] ?? []);

    if ($public) {
        unset(
            $settings['contact_recipient_email'],
            $settings['careers_recipient_email'],
            $settings['mail_from_name'],
            $settings['mail_from_email'],
            $settings['security_alert_email'],
            $settings['two_factor_auth_enabled'],
            $settings['authenticator_period_seconds']
        );
    }

    return $settings;
}

function save_settings_payload(array $patch): array
{
    $allowedKeys = array_keys(default_site_settings());
    $store = read_store();
    $settings = array_merge(default_site_settings(), $store['settings'] ?? []);

    foreach ($allowedKeys as $key) {
        if (!array_key_exists($key, $patch)) {
            continue;
        }

        if ($key === 'two_factor_auth_enabled') {
            $settings[$key] = normalize_bool($patch[$key]) === 1;
            continue;
        }

        if ($key === 'authenticator_period_seconds') {
            $settings[$key] = normalize_authenticator_period_seconds($patch[$key] ?? 30);
            continue;
        }

        $settings[$key] = sanitize_text((string)$patch[$key]);
    }

    $store['settings'] = $settings;
    write_store($store);

    return $settings;
}

function normalize_reply(array $reply): array
{
    return [
        'id' => (int)($reply['id'] ?? 0),
        'subject' => (string)($reply['subject'] ?? ''),
        'message' => (string)($reply['message'] ?? ''),
        'adminName' => $reply['adminName'] ?? null,
        'createdAt' => (string)($reply['createdAt'] ?? now_utc()),
    ];
}

function normalize_submission_item(array $item): array
{
    $replies = $item['replies'] ?? [];
    if (!is_array($replies)) {
        $replies = [];
    }

    return [
        'id' => (int)($item['id'] ?? 0),
        'name' => (string)($item['name'] ?? ''),
        'email' => (string)($item['email'] ?? ''),
        'phone' => (string)($item['phone'] ?? ''),
        'role' => $item['role'] ?? null,
        'message' => (string)($item['message'] ?? ''),
        'status' => (string)($item['status'] ?? 'unread'),
        'adminNotes' => (string)($item['adminNotes'] ?? ''),
        'createdAt' => (string)($item['createdAt'] ?? now_utc()),
        'updatedAt' => (string)($item['updatedAt'] ?? now_utc()),
        'replies' => array_map('normalize_reply', $replies),
        'visitorAlias' => (string)($item['visitorAlias'] ?? ''),
        'browser' => (string)($item['browser'] ?? ''),
        'deviceType' => (string)($item['deviceType'] ?? ''),
        'referrer' => $item['referrer'] ?? null,
        'resumeFileName' => $item['resumeFileName'] ?? null,
        'resumeOriginalName' => $item['resumeOriginalName'] ?? null,
        'resumeMimeType' => $item['resumeMimeType'] ?? null,
        'resumeSizeBytes' => isset($item['resumeSizeBytes']) ? (int)$item['resumeSizeBytes'] : null,
    ];
}

function list_admin_users(?array $store = null): array
{
    $store = $store ?? read_store();
    $users = array_map('public_admin', $store['admins'] ?? []);

    usort($users, static function (array $left, array $right): int {
        return strcmp((string)$left['name'], (string)$right['name']);
    });

    return $users;
}

function list_audit_logs(?array $store = null): array
{
    $store = $store ?? read_store();
    $logs = $store['security']['auditLogs'] ?? [];
    $logs = array_map('normalize_audit_log', $logs);

    usort($logs, static function (array $left, array $right): int {
        return strcmp((string)$right['createdAt'], (string)$left['createdAt']);
    });

    return $logs;
}

function list_admin_sessions(?array $store = null): array
{
    return array_map('public_admin_session_record', admin_session_records($store));
}

function paginate_collection(array $items, int $page = 1, int $pageSize = 10): array
{
    $pageSize = max(1, min(100, $pageSize));
    $total = count($items);
    $totalPages = max(1, (int)ceil($total / $pageSize));
    $page = max(1, min($page, $totalPages));

    return [
        'items' => array_values(array_slice($items, ($page - 1) * $pageSize, $pageSize)),
        'page' => $page,
        'pageSize' => $pageSize,
        'total' => $total,
        'totalPages' => $totalPages,
    ];
}

function admin_login_sessions(?array $store = null): array
{
    return list_admin_sessions($store);
}

function panel_activity_logs(?array $store = null, ?array $viewer = null): array
{
    $viewer = $viewer ?? current_admin();
    $logs = array_values(array_filter(
        list_audit_logs($store),
        static function (array $log): bool {
            if (($log['actorId'] ?? null) === null) {
                return false;
            }

            return (string)($log['type'] ?? '') !== 'auth.login.success';
        }
    ));

    if ($viewer !== null && !is_primary_admin($viewer)) {
        $logs = array_values(array_filter(
            $logs,
            static fn(array $log): bool => (int)($log['actorId'] ?? 0) === (int)($viewer['id'] ?? 0)
        ));
    }

    return $logs;
}

function suspicious_audit_logs(?array $store = null): array
{
    $logs = list_audit_logs($store);

    return array_values(array_filter($logs, static function (array $log): bool {
        return in_array((string)$log['severity'], ['warning', 'error'], true);
    }));
}

function suspicious_activity_groups(?array $store = null): array
{
    $store = $store ?? read_store();
    $logs = suspicious_audit_logs($store);
    $blockedIps = blocked_ip_list($store);
    $groups = [];
    $nextId = 1;

    foreach ($logs as $log) {
        $details = decode_metadata($log['details'] ?? []);
        $loginId = sanitize_text((string)($log['actorLoginId'] ?? ($details['loginId'] ?? '')));
        $actorName = $log['actorName'] ?? null;
        $ipAddress = sanitize_text((string)($log['ipAddress'] ?? ''));
        $browser = sanitize_text((string)($log['browser'] ?? current_browser_name()));
        $deviceType = sanitize_text((string)($log['deviceType'] ?? current_device_type()));
        $requestFingerprint = sanitize_text((string)($details['requestFingerprint'] ?? ''));
        $groupKey = strtolower(implode('|', [
            $loginId !== '' ? $loginId : 'unknown',
            $ipAddress !== '' ? $ipAddress : 'unknown',
            $browser !== '' ? $browser : 'unknown',
            $deviceType !== '' ? $deviceType : 'unknown',
        ]));

        if (!isset($groups[$groupKey])) {
            $groups[$groupKey] = [
                'id' => $nextId++,
                'loginId' => $loginId !== '' ? $loginId : null,
                'actorName' => $actorName,
                'actorRole' => $log['actorRole'] ?? null,
                'ipAddress' => $ipAddress,
                'browser' => $browser,
                'deviceType' => $deviceType,
                'locationHint' => $log['locationHint'] ?? null,
                'requestFingerprint' => $requestFingerprint !== '' ? $requestFingerprint : null,
                'firstSeenAt' => $log['createdAt'],
                'lastSeenAt' => $log['createdAt'],
                'latestMessage' => $log['message'],
                'severity' => $log['severity'],
                'count' => 0,
                'types' => [],
                'messages' => [],
                'blocked' => in_array($ipAddress, $blockedIps, true) || normalize_bool($log['blocked'] ?? false) === 1,
            ];
        }

        $group = &$groups[$groupKey];
        $group['count']++;

        if (strcmp((string)$log['createdAt'], (string)$group['firstSeenAt']) < 0) {
            $group['firstSeenAt'] = $log['createdAt'];
        }

        if (strcmp((string)$log['createdAt'], (string)$group['lastSeenAt']) >= 0) {
            $group['lastSeenAt'] = $log['createdAt'];
            $group['latestMessage'] = $log['message'];
            $group['severity'] = $log['severity'];
            if (($group['actorName'] ?? null) === null && $actorName !== null) {
                $group['actorName'] = $actorName;
            }
            if (($group['requestFingerprint'] ?? null) === null && $requestFingerprint !== '') {
                $group['requestFingerprint'] = $requestFingerprint;
            }
        }

        if (!in_array((string)$log['type'], $group['types'], true)) {
            $group['types'][] = (string)$log['type'];
        }

        if (!in_array((string)$log['message'], $group['messages'], true)) {
            $group['messages'][] = (string)$log['message'];
        }

        $group['blocked'] = $group['blocked']
            || in_array($ipAddress, $blockedIps, true)
            || normalize_bool($log['blocked'] ?? false) === 1;

        unset($group);
    }

    $items = array_values(array_map(static function (array $group): array {
        $group['messages'] = array_values(array_slice($group['messages'], 0, 3));
        $group['types'] = array_values($group['types']);
        return $group;
    }, $groups));

    usort($items, static function (array $left, array $right): int {
        return strcmp((string)($right['lastSeenAt'] ?? ''), (string)($left['lastSeenAt'] ?? ''));
    });

    return $items;
}

function list_submissions_from_store(array $store, string $type): array
{
    $items = $store['submissions'][$type] ?? [];
    $items = array_map('normalize_submission_item', $items);
    usort($items, static fn(array $a, array $b): int => strcmp($b['createdAt'], $a['createdAt']));
    return $items;
}

function list_submissions(string $type): array
{
    return list_submissions_from_store(read_store(), $type);
}

function save_submission_item(string $type, array $payload): array
{
    if (!in_array($type, ['contact', 'career'], true)) {
        json_response(['error' => 'Invalid submission type.'], 422);
    }

    $store = read_store();
    $items = $store['submissions'][$type];
    $visitorContext = current_visitor_context();
    $item = [
        'id' => next_id($items),
        'name' => sanitize_text($payload['name'] ?? ''),
        'email' => sanitize_text($payload['email'] ?? ''),
        'phone' => sanitize_text($payload['phone'] ?? ''),
        'role' => sanitize_text($payload['role'] ?? '') ?: null,
        'message' => sanitize_text($payload['message'] ?? ''),
        'status' => 'unread',
        'adminNotes' => '',
        'createdAt' => now_utc(),
        'updatedAt' => now_utc(),
        'replies' => [],
        'visitorId' => $visitorContext['visitorId'],
        'visitorAlias' => $visitorContext['visitorAlias'],
        'sessionHash' => $visitorContext['sessionHash'],
        'browser' => $visitorContext['browser'],
        'deviceType' => $visitorContext['deviceType'],
        'referrer' => $visitorContext['referrer'],
        'ipHash' => $visitorContext['ipHash'],
        'resumeFileName' => $payload['resumeFileName'] ?? null,
        'resumeOriginalName' => $payload['resumeOriginalName'] ?? null,
        'resumeMimeType' => $payload['resumeMimeType'] ?? null,
        'resumeSizeBytes' => isset($payload['resumeSizeBytes']) ? (int)$payload['resumeSizeBytes'] : null,
        'resumePath' => $payload['resumePath'] ?? null,
    ];

    $items[] = $item;
    $store['submissions'][$type] = $items;
    write_store($store);
    return normalize_submission_item($item);
}

function update_submission_item(string $type, int $id, string $status, string $adminNotes): array
{
    $allowedStatuses = ['unread', 'read', 'in_progress', 'replied', 'closed'];

    if (!in_array($status, $allowedStatuses, true)) {
        json_response(['error' => 'Invalid submission status.'], 422);
    }

    $store = read_store();
    $items = $store['submissions'][$type] ?? [];

    foreach ($items as $index => $item) {
        if ((int)($item['id'] ?? 0) !== $id) {
            continue;
        }

        $items[$index]['status'] = $status;
        $items[$index]['adminNotes'] = $adminNotes;
        $items[$index]['updatedAt'] = now_utc();
        $store['submissions'][$type] = $items;
        write_store($store);
        return list_submissions($type);
    }

    json_response(['error' => 'Submission not found.'], 404);
}

function add_submission_reply(string $type, int $submissionId, array $reply): array
{
    $store = read_store();
    $items = $store['submissions'][$type] ?? [];

    foreach ($items as $index => $item) {
        if ((int)($item['id'] ?? 0) !== $submissionId) {
            continue;
        }

        $replies = is_array($item['replies'] ?? null) ? $item['replies'] : [];
        $replies[] = [
            'id' => next_id($replies),
            'subject' => sanitize_text($reply['subject'] ?? ''),
            'message' => sanitize_text($reply['message'] ?? ''),
            'adminName' => $reply['adminName'] ?? 'Admin',
            'createdAt' => now_utc(),
        ];

        $items[$index]['replies'] = $replies;
        $items[$index]['status'] = 'replied';
        $items[$index]['updatedAt'] = now_utc();
        $store['submissions'][$type] = $items;
        write_store($store);

        return list_submissions($type);
    }

    json_response(['error' => 'Submission not found.'], 404);
}

function record_event(array $payload): array
{
    $store = read_store();
    $events = $store['events'] ?? [];
    $visitorContext = current_visitor_context();
    $metadata = decode_metadata($payload['metadata'] ?? []);
    $metadata['browser'] = $visitorContext['browser'];
    $metadata['deviceType'] = $visitorContext['deviceType'];
    $metadata['referrer'] = $visitorContext['referrer'];
    $metadata['visitorAlias'] = $visitorContext['visitorAlias'];
    $event = [
        'id' => next_id($events),
        'eventType' => sanitize_text($payload['eventType'] ?? 'page_view'),
        'page' => sanitize_text($payload['page'] ?? '/'),
        'label' => sanitize_text($payload['label'] ?? '') ?: null,
        'metadata' => $metadata,
        'visitorId' => $visitorContext['visitorId'],
        'visitorAlias' => $visitorContext['visitorAlias'],
        'sessionHash' => $visitorContext['sessionHash'],
        'browser' => $visitorContext['browser'],
        'deviceType' => $visitorContext['deviceType'],
        'referrer' => $visitorContext['referrer'],
        'ipHash' => $visitorContext['ipHash'],
        'createdAt' => now_utc(),
    ];
    $events[] = $event;
    $store['events'] = $events;
    write_store($store);
    return $event;
}

function dashboard_summary(?array $viewer = null, ?array $store = null): array
{
    $store = $store ?? read_store();
    $viewer = $viewer ?? current_admin() ?? ['role' => 'admin', 'permissions' => default_role_permissions('admin')];
    $contacts = list_submissions_from_store($store, 'contact');
    $careers = list_submissions_from_store($store, 'career');
    $events = $store['events'] ?? [];
    $logs = list_audit_logs($store);

    $pageViews = 0;
    $formSubmissions = 0;
    $pendingInbox = 0;
    $uniqueVisitors = [];
    $topPages = [];
    $eventBreakdown = [];
    $contentBreakdown = [];

    foreach ([$contacts, $careers] as $collection) {
        foreach ($collection as $item) {
            if (in_array($item['status'], ['unread', 'in_progress'], true)) {
                $pendingInbox++;
            }
        }
    }

    foreach ($events as $event) {
        $eventType = (string)($event['eventType'] ?? 'event');
        $page = (string)($event['page'] ?? '/');
        $identityKey = sanitize_text((string)($event['visitorId'] ?? '')) ?: sanitize_text((string)($event['sessionHash'] ?? ''));

        if ($eventType === 'page_view') {
            $pageViews++;
        }

        if (str_contains($eventType, 'form') || str_contains($eventType, 'submit')) {
            $formSubmissions++;
        }

        $topPages[$page] = ($topPages[$page] ?? 0) + 1;
        $eventBreakdown[$eventType] = ($eventBreakdown[$eventType] ?? 0) + 1;

        if ($identityKey !== '') {
            $uniqueVisitors[$identityKey] = true;
        }
    }

    foreach (content_types() as $type) {
        $contentBreakdown[] = [
            'type' => $type,
            'total' => count($store['content'][$type] ?? []),
        ];
    }

    arsort($topPages);
    arsort($eventBreakdown);

    $recentEvents = array_slice(array_reverse($events), 0, 8);
    $recentAdminLogins = array_slice(admin_login_sessions($store), 0, 8);
    $recentPanelActivity = array_slice(panel_activity_logs($store, $viewer), 0, 10);
    $suspiciousActivity = array_slice(suspicious_activity_groups($store), 0, 10);

    return [
        'generatedAt' => now_utc(),
        'viewerRole' => (string)($viewer['role'] ?? 'other'),
        'viewerPermissions' => normalize_permissions($viewer['permissions'] ?? [], (string)($viewer['role'] ?? 'other')),
        'stats' => [
            'contactCount' => count($contacts),
            'careerCount' => count($careers),
            'pageViews' => $pageViews,
            'formSubmissions' => $formSubmissions,
            'pendingInbox' => $pendingInbox,
            'uniqueVisitors' => count($uniqueVisitors),
            'adminUsers' => count($store['admins'] ?? []),
            'blockedIps' => count(blocked_ip_list($store)),
        ],
        'topPages' => array_map(
            static fn(string $page, int $total): array => ['page' => $page, 'total' => $total],
            array_keys(array_slice($topPages, 0, 10, true)),
            array_values(array_slice($topPages, 0, 10, true))
        ),
        'eventBreakdown' => array_map(
            static fn(string $eventType, int $total): array => ['eventType' => $eventType, 'total' => $total],
            array_keys($eventBreakdown),
            array_values($eventBreakdown)
        ),
        'contentBreakdown' => $contentBreakdown,
        'recentEvents' => array_map(static function (array $event): array {
            return [
                'id' => (int)($event['id'] ?? 0),
                'eventType' => (string)($event['eventType'] ?? 'event'),
                'page' => (string)($event['page'] ?? '/'),
                'label' => $event['label'] ?? null,
                'createdAt' => (string)($event['createdAt'] ?? now_utc()),
            ];
        }, $recentEvents),
        'recentContacts' => array_slice($contacts, 0, 6),
        'recentCareers' => array_slice($careers, 0, 6),
        'recentAdminLogins' => $recentAdminLogins,
        'recentPanelActivity' => $recentPanelActivity,
        'suspiciousActivity' => $suspiciousActivity,
        'blockedIps' => blocked_ip_list($store),
    ];
}

function system_health_summary(?array $store = null): array
{
    $startedAt = microtime(true);
    $store = $store ?? read_store();
    $storeFile = store_path();
    $uploads = resumes_dir();
    $events = $store['events'] ?? [];
    $dayAgo = gmdate('Y-m-d H:i:s', time() - 86400);
    $contentItems = 0;

    foreach (content_types() as $type) {
        $contentItems += count($store['content'][$type] ?? []);
    }

    $recentEvents24h = count(array_filter($events, static function (array $event) use ($dayAgo): bool {
        return strcmp((string)($event['createdAt'] ?? ''), $dayAgo) >= 0;
    }));

    $recentAdminLogins24h = count(array_filter(admin_login_sessions($store), static function (array $session) use ($dayAgo): bool {
        return strcmp((string)($session['loginAt'] ?? ''), $dayAgo) >= 0;
    }));

    $uploadsCount = 0;
    if (is_dir($uploads)) {
        $files = glob($uploads . DIRECTORY_SEPARATOR . '*');
        $uploadsCount = is_array($files) ? count($files) : 0;
    }

    $summaryBuildMs = (int)round((microtime(true) - $startedAt) * 1000);

    return [
        'databaseMode' => 'JSON store',
        'storePath' => $storeFile,
        'storeReadable' => file_exists($storeFile) && is_readable($storeFile),
        'storeWritable' => file_exists($storeFile) && is_writable($storeFile),
        'storeSizeBytes' => file_exists($storeFile) ? (int)filesize($storeFile) : 0,
        'mailConfigured' => smtp_is_configured(),
        'uploadsPath' => $uploads,
        'uploadsAvailable' => is_dir($uploads) || is_dir(uploads_dir()),
        'phpVersion' => PHP_VERSION,
        'backendTime' => now_utc(),
        'adminUsers' => count($store['admins'] ?? []),
        'contactSubmissions' => count($store['submissions']['contact'] ?? []),
        'careerSubmissions' => count($store['submissions']['career'] ?? []),
        'blockedIps' => count(blocked_ip_list($store)),
        'auditEvents' => count($store['security']['auditLogs'] ?? []),
        'rateLimitBuckets' => count($store['security']['rateLimits'] ?? []),
        'eventCount' => count($events),
        'contentItems' => $contentItems,
        'submissionsTotal' => count($store['submissions']['contact'] ?? []) + count($store['submissions']['career'] ?? []),
        'uploadsCount' => $uploadsCount,
        'recentEvents24h' => $recentEvents24h,
        'recentAdminLogins24h' => $recentAdminLogins24h,
        'summaryBuildMs' => $summaryBuildMs,
        'memoryUsageMb' => round(memory_get_usage(true) / (1024 * 1024), 2),
        'peakMemoryUsageMb' => round(memory_get_peak_usage(true) / (1024 * 1024), 2),
        'phpSapi' => PHP_SAPI,
        'opcacheEnabled' => extension_loaded('Zend OPcache') && normalize_bool(ini_get('opcache.enable')) === 1,
    ];
}

function admin_bootstrap_payload(array $viewer): array
{
    $store = read_store();

    return [
        'admin' => public_admin($viewer),
        'settings' => settings_payload(),
        'dashboard' => dashboard_summary($viewer, $store),
        'health' => can_admin_access($viewer, 'health') ? system_health_summary($store) : null,
        'users' => is_primary_admin($viewer) ? list_admin_users($store) : [],
    ];
}
