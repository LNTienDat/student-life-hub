import { TEN_DANH_MUC } from '../constants';
import { t } from '../i18n/language';

export function categoryDisplayName(item) {
  if (!item) return '';
  return item.macDinh && item.ten === TEN_DANH_MUC[item.ma] ? t(item.ten) : item.ten;
}
