import 'package:flutter/foundation.dart';
import 'dart:io';

class ApiConstants {
	static String get baseUrl {
		if (kIsWeb) {
			return 'http://localhost:3001/api';
		}
		if (Platform.isAndroid) {
			return 'http://10.0.2.2:3001/api';
		}
		return 'http://localhost:3001/api';
	}
}
