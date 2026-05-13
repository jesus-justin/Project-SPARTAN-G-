import 'package:flutter/material.dart';

class ContentCardWidget extends StatelessWidget {
  final String contentId;
  final String title;
  final String category;
  final String contentType;
  final VoidCallback onTap;

  const ContentCardWidget({
    required this.contentId,
    required this.title,
    required this.category,
    required this.contentType,
    required this.onTap,
    super.key,
  });

  IconData _getTypeIcon() {
    switch (contentType.toLowerCase()) {
      case 'video':
        return Icons.play_circle_fill;
      case 'article':
        return Icons.article;
      case 'brochure':
        return Icons.description;
      case 'exercise':
        return Icons.fitness_center;
      default:
        return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: <Widget>[
              Icon(
                _getTypeIcon(),
                size: 32,
                color: Colors.redAccent,
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      category,
                      style: const TextStyle(
                        fontSize: 12,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}
