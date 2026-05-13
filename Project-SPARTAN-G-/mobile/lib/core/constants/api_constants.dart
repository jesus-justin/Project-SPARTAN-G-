import 'package:flutter/foundation.dart';
import 'dart:io';

class ApiConstants {
	static const List<String> androidBaseUrls = <String>[
		'http://192.168.1.4:3001/api',
		'http://192.168.1.5:3001/api',
	];

	static String get baseUrl {
		if (kIsWeb) {
			return 'http://localhost:3001/api';
		}
		if (Platform.isAndroid) {
			// For physical devices, use the host machine Wi-Fi IP so device can reach the backend.
			// Current Wi-Fi IP (detected at last check): 192.168.1.4
			return androidBaseUrls.first;
		}
		return 'http://localhost:3001/api';
	}

	static List<String> get candidateBaseUrls {
		if (kIsWeb) {
			return <String>['http://localhost:3001/api'];
		}
		if (Platform.isAndroid) {
			return androidBaseUrls;
		}
		return <String>['http://localhost:3001/api'];
	}
}
