/**
 * DİL, HER ŞEYDEN ÖNCE: main.tsx'in İLK importu. Modül düzeyinde hesaplanan metinler (sabit listeler) import
 * anında çevrilir; dil o andan önce kayıttan okunmuş olmalı. Ayarlar'da dil değişince sayfa yeniden yüklenir.
 */
import { dilAyarla } from './index';
import { loadSave } from '../game/save';

dilAyarla(loadSave().settings.dil);
