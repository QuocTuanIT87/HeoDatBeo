import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { Alert } from "../components/CustomAlert";
import { storage } from "../store/storage";
import { GoldItem, GoldSaleRecord, SoldItemSnapshot } from "../types";
import { formatCurrency } from "../utils/format";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Coins,
  History,
  TrendingUp,
  Scale,
  Calendar,
  X,
  PlusCircle,
  TrendingDown,
  Info,
  RotateCcw,
  Trash2,
} from "lucide-react-native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { styles } from "../styles/GoldHistoryScreen";

type GoldTab = "active" | "sales" | "all";

const GoldHistoryScreen = () => {
  const isFocused = useIsFocused();
  const navigation = useNavigation();

  const [tab, setTab] = useState<GoldTab>("active");
  const [goldItems, setGoldItems] = useState<GoldItem[]>([]);
  const [goldSales, setGoldSales] = useState<GoldSaleRecord[]>([]);

  // Modals Visibility
  const [buyVisible, setBuyVisible] = useState(false);
  const [sellVisible, setSellVisible] = useState(false);
  const [exchangeVisible, setExchangeVisible] = useState(false);

  // Buy Form States
  const [buyQty, setBuyQty] = useState("");
  const [buyUnit, setBuyUnit] = useState<"phân" | "chỉ" | "cây">("chỉ");
  const [buyPrice, setBuyPrice] = useState("");
  const [buyCraftFee, setBuyCraftFee] = useState("");
  const [buyDate, setBuyDate] = useState(new Date());
  const [buyGoldType, setBuyGoldType] = useState("");
  const [showBuyDatePicker, setShowBuyDatePicker] = useState(false);
  const [showBuyTimePicker, setShowBuyTimePicker] = useState(false);

  // Sell Form States
  const [sellPrice, setSellPrice] = useState("");
  const [selectedSellIds, setSelectedSellIds] = useState<Record<string, boolean>>({});
  const [sellDate, setSellDate] = useState(new Date());
  const [showSellDatePicker, setShowSellDatePicker] = useState(false);
  const [showSellTimePicker, setShowSellTimePicker] = useState(false);

  // Exchange Form States
  const [selectedExchangeIds, setSelectedExchangeIds] = useState<Record<string, boolean>>({});
  const [exchangeComp, setExchangeComp] = useState("");
  const [exchangeCraftFee, setExchangeCraftFee] = useState("");
  const [exchangeUnit, setExchangeUnit] = useState<"phân" | "chỉ" | "cây">("chỉ");
  const [exchangeDate, setExchangeDate] = useState(new Date());
  const [showExchangeDatePicker, setShowExchangeDatePicker] = useState(false);
  const [showExchangeTimePicker, setShowExchangeTimePicker] = useState(false);

  useEffect(() => {
    if (isFocused) {
      loadData();
    }
  }, [isFocused]);

  const loadData = async () => {
    const items = await storage.getGoldItems();
    const sales = await storage.getGoldSales();
    setGoldItems(items || []);
    setGoldSales(sales || []);
  };

  // Helper conversions: 1 cây = 10 chỉ = 100 phân
  const convertToPhan = (qty: number, unit: "phân" | "chỉ" | "cây"): number => {
    if (unit === "phân") return qty;
    if (unit === "chỉ") return qty * 10;
    return qty * 100;
  };

  const formatGoldQty = (phan: number): string => {
    const cay = Math.floor(phan / 100);
    const remainder = phan % 100;
    const chi = Math.floor(remainder / 10);
    const p = Math.round((remainder % 10) * 100) / 100;

    const parts = [];
    if (cay > 0) parts.push(`${cay} cây`);
    if (chi > 0) parts.push(`${chi} chỉ`);
    if (p > 0) parts.push(`${p} phân`);

    return parts.length > 0 ? parts.join(" ") : "0 phân";
  };

  const formatRawQty = (qty: number, unit: string) => {
    return `${qty.toLocaleString("vi-VN")} ${unit}`;
  };

  // Portfolio calculations
  const activeItems = goldItems.filter((item) => item.status === "Tích trữ");
  const totalActiveQtyInPhan = activeItems.reduce(
    (sum, item) => sum + item.quantityInPhan,
    0
  );
  const totalActivePrice = activeItems.reduce(
    (sum, item) =>
      sum + item.buyPrice + item.craftFee + (item.exchangeFee || 0),
    0
  );
  const totalProfit = goldSales.reduce(
    (sum, sale) => sum + sale.difference,
    0
  );

  // Form input formatting
  const formatMoneyInput = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, "");
    if (!numeric) return "";
    return parseInt(numeric, 10).toLocaleString("vi-VN");
  };

  const parseMoney = (formatted: string): number => {
    const numeric = formatted.replace(/[^\d]/g, "");
    if (!numeric) return 0;
    return parseInt(numeric, 10);
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // BUY ACTION
  const handleBuySubmit = async () => {
    if (!buyGoldType.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập loại vàng (ví dụ: SJC 9999, Nhẫn trơn PNJ,...).");
      return;
    }

    const parsedQty = parseFloat(buyQty.replace(",", "."));
    if (isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập số lượng vàng hợp lệ.");
      return;
    }

    if ((buyUnit === "phân" || buyUnit === "chỉ") && parsedQty > 9) {
      Alert.alert("Lỗi", `Số lượng mua đối với ${buyUnit} không được vượt quá 9.`);
      return;
    }

    if (buyUnit === "chỉ" || buyUnit === "cây") {
      if (parsedQty < 0.5) {
        Alert.alert("Lỗi", `Số lượng mua đối với ${buyUnit} phải từ 0.5 trở lên.`);
        return;
      }
      const remainder = parsedQty % 0.5;
      const isMultipleOfHalf = Math.abs(remainder) < 1e-9 || Math.abs(remainder - 0.5) < 1e-9;
      if (!isMultipleOfHalf) {
        Alert.alert("Lỗi", `Số lượng mua đối với ${buyUnit} phải là bội số của 0.5 (ví dụ: 0.5, 1, 1.5, 2, ...).`);
        return;
      }
    } else if (buyUnit === "phân") {
      const isInteger = Math.abs(parsedQty - Math.round(parsedQty)) < 1e-9;
      if (!isInteger) {
        Alert.alert("Lỗi", "Số lượng mua đối với phân phải là số nguyên dương (ví dụ: 1, 2, 3, ...).");
        return;
      }
    }

    const price = parseMoney(buyPrice);
    if (price <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập lượng tiền mua hợp lệ.");
      return;
    }

    const craft = parseMoney(buyCraftFee);

    const quantityInPhan = convertToPhan(parsedQty, buyUnit);

    const newItem: GoldItem = {
      id: "gold_" + Date.now() + Math.random().toString(36).substring(2, 5),
      rawQuantity: parsedQty,
      rawUnit: buyUnit,
      quantityInPhan,
      buyDate: buyDate.getTime(),
      buyPrice: price,
      status: "Tích trữ",
      craftFee: craft,
      isExchanged: false,
      goldType: buyGoldType.trim(),
    };

    const success = await storage.saveGoldItem(newItem);
    if (success) {
      Alert.alert("Thành công", "Đã lưu lại lịch sử mua vàng! 🪙");
      setBuyVisible(false);
      resetBuyForm();
      loadData();
    } else {
      Alert.alert("Lỗi", "Không thể lưu lịch sử mua vàng.");
    }
  };

  const resetBuyForm = () => {
    setBuyQty("");
    setBuyUnit("chỉ");
    setBuyPrice("");
    setBuyCraftFee("");
    setBuyDate(new Date());
    setBuyGoldType("");
  };

  // SELL ACTION
  // Eligible items for sell are "Tích trữ" only
  const eligibleSellItems = goldItems.filter(
    (item) => item.status === "Tích trữ"
  );

  const selectedSellItems = eligibleSellItems.filter(
    (item) => selectedSellIds[item.id]
  );
  
  const sellTotalQtyInPhan = selectedSellItems.reduce(
    (sum, item) => sum + item.quantityInPhan,
    0
  );

  const sellTotalBuyPrice = selectedSellItems.reduce(
    (sum, item) =>
      sum + item.buyPrice + item.craftFee + (item.exchangeFee || 0),
    0
  );

  const sellInputPrice = parseMoney(sellPrice);
  const sellDifference = sellInputPrice - sellTotalBuyPrice;
  const sellStatus = sellDifference >= 0 ? "Lời" : "Lỗ";

  const handleSellSubmit = async () => {
    if (selectedSellItems.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một miếng vàng để bán.");
      return;
    }

    if (sellInputPrice <= 0) {
      Alert.alert("Lỗi", "Vui lòng nhập giá bán ra hợp lệ.");
      return;
    }

    const newSale: GoldSaleRecord = {
      id: "sale_" + Date.now() + Math.random().toString(36).substring(2, 5),
      sellDate: sellDate.getTime(),
      sellPrice: sellInputPrice,
      buyPrice: sellTotalBuyPrice,
      difference: sellDifference,
      status: sellStatus,
      soldItemIds: selectedSellItems.map((item) => item.id),
      soldItems: selectedSellItems.map((item) => ({
        id: item.id,
        buyDate: item.buyDate,
        quantityInPhan: item.quantityInPhan,
        rawQuantity: item.rawQuantity,
        rawUnit: item.rawUnit,
        goldType: item.goldType,
        craftFee: item.craftFee,
        exchangeFee: item.exchangeFee,
      })),
    };

    // Mark selected items as "Đã bán"
    const updatedItems = selectedSellItems.map((item) => ({
      ...item,
      status: "Đã bán" as const,
    }));

    const successItems = await storage.updateGoldItemsBulk(updatedItems);
    const successSale = await storage.saveGoldSale(newSale);

    if (successItems && successSale) {
      Alert.alert(
        "Thành công",
        `Đã hoàn tất bán vàng! Trạng thái: ${sellStatus} ${formatCurrency(Math.abs(sellDifference))} đ.`
      );
      setSellVisible(false);
      resetSellForm();
      loadData();
    } else {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi thực hiện bán vàng.");
    }
  };

  const resetSellForm = () => {
    setSellPrice("");
    setSelectedSellIds({});
    setSellDate(new Date());
  };

  const toggleSelectSell = (id: string) => {
    setSelectedSellIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // EXCHANGE ACTION
  // Eligible items for exchange are "Tích trữ" only and unit is not "cây"
  const eligibleExchangeItems = goldItems.filter(
    (item) => item.status === "Tích trữ" && item.rawUnit !== "cây"
  );

  const selectedExchangeItems = eligibleExchangeItems.filter(
    (item) => selectedExchangeIds[item.id]
  );

  // Unit of selected exchange items
  const selectedExchangeUnit = selectedExchangeItems.length > 0 ? selectedExchangeItems[0].rawUnit : null;

  const exchangeTotalQtyInPhan = selectedExchangeItems.reduce(
    (sum, item) => sum + item.quantityInPhan,
    0
  );

  const exchangeTotalBuyPrice = selectedExchangeItems.reduce(
    (sum, item) => sum + item.buyPrice,
    0
  );

  // Dynamic calculation of target unit and quantity for preview
  let displayExchangeTargetUnit: "phân" | "chỉ" | "cây" | "" = "";
  let displayExchangeTargetQty = 0;
  if (selectedExchangeItems.length > 0) {
    const firstUnit = selectedExchangeItems[0].rawUnit;
    const totalRawQty = selectedExchangeItems.reduce((sum, item) => sum + item.rawQuantity, 0);
    const divided = totalRawQty / 10;
    const remainder = divided % 0.5;
    const isMultipleOfHalf = Math.abs(remainder) < 1e-9 || Math.abs(remainder - 0.5) < 1e-9;
    if (isMultipleOfHalf) {
      displayExchangeTargetUnit = firstUnit === "phân" ? "chỉ" : "cây";
      displayExchangeTargetQty = divided;
    } else {
      displayExchangeTargetUnit = firstUnit;
      displayExchangeTargetQty = totalRawQty;
    }
  }

  const handleExchangeSubmit = async () => {
    if (selectedExchangeItems.length === 0) {
      Alert.alert("Lỗi", "Vui lòng chọn ít nhất một miếng vàng để đổi.");
      return;
    }

    if (selectedExchangeItems.length < 2) {
      Alert.alert("Lỗi", "Vui lòng chọn từ 2 miếng vàng trở lên để thực hiện quy đổi.");
      return;
    }

    const firstUnit = selectedExchangeItems[0].rawUnit;
    const allSameUnit = selectedExchangeItems.every((item) => item.rawUnit === firstUnit);
    if (!allSameUnit) {
      Alert.alert("Lỗi", "Vui lòng chọn các miếng vàng cùng đơn vị (phân hoặc chỉ) để quy đổi.");
      return;
    }

    if (firstUnit === "cây") {
      Alert.alert("Lỗi", "Cây vàng là đơn vị lớn nhất, không thể chọn để quy đổi.");
      return;
    }

    // Sum of raw quantities
    const totalRawQty = selectedExchangeItems.reduce((sum, item) => sum + item.rawQuantity, 0);

    const unitLabel = firstUnit === "phân" ? "phân" : "chỉ";
    const isDivisibleBy5 = Math.abs(totalRawQty % 5) < 1e-9 || Math.abs((totalRawQty % 5) - 5) < 1e-9;
    if (!isDivisibleBy5) {
      Alert.alert(
        "Lỗi",
        `Tổng số lượng để quy đổi phải chia hết cho 5 (ví dụ: 5, 10, 15...). Hiện tại đang chọn tổng cộng ${totalRawQty} ${unitLabel}.`
      );
      return;
    }

    const divided = totalRawQty / 10;
    const remainder = divided % 0.5;
    const isMultipleOfHalf = Math.abs(remainder) < 1e-9 || Math.abs(remainder - 0.5) < 1e-9;

    let targetUnit: "phân" | "chỉ" | "cây";
    let newRawQuantity: number;

    if (isMultipleOfHalf) {
      targetUnit = firstUnit === "phân" ? "chỉ" : "cây";
      newRawQuantity = divided;
    } else {
      targetUnit = firstUnit;
      newRawQuantity = totalRawQty;
    }

    const compensation = parseMoney(exchangeComp);
    const craftFee = parseMoney(exchangeCraftFee);

    // 1. Mark selected items as "Đã quy đổi"
    const updatedItems = selectedExchangeItems.map((item) => ({
      ...item,
      status: "Đã quy đổi" as const,
    }));

    // 2. Create the new GoldItem
    const newGoldItem: GoldItem = {
      id: "gold_" + Date.now() + Math.random().toString(36).substring(2, 5),
      rawQuantity: newRawQuantity,
      rawUnit: targetUnit,
      quantityInPhan: exchangeTotalQtyInPhan,
      buyDate: exchangeDate.getTime(),
      buyPrice: exchangeTotalBuyPrice,
      status: "Tích trữ",
      craftFee,
      exchangeFee: compensation > 0 ? compensation : undefined,
      isExchanged: true,
      exchangedFromIds: selectedExchangeItems.map((item) => item.id),
    };

    const successItems = await storage.updateGoldItemsBulk(updatedItems);
    const successNewItem = await storage.saveGoldItem(newGoldItem);

    if (successItems && successNewItem) {
      Alert.alert("Thành công", "Quy đổi vàng thành công! Miếng vàng mới đã được tích lũy. 🪙");
      setExchangeVisible(false);
      resetExchangeForm();
      loadData();
    } else {
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi quy đổi vàng.");
    }
  };

  const resetExchangeForm = () => {
    setSelectedExchangeIds({});
    setExchangeComp("");
    setExchangeCraftFee("");
    setExchangeUnit("chỉ");
    setExchangeDate(new Date());
  };

  const toggleSelectExchange = (id: string) => {
    const item = eligibleExchangeItems.find((i) => i.id === id);
    if (!item) return;

    if (
      selectedExchangeUnit !== null &&
      item.rawUnit !== selectedExchangeUnit &&
      !selectedExchangeIds[id]
    ) {
      Alert.alert(
        "Thông báo",
        "Bạn chỉ được chọn các miếng vàng cùng đơn vị (phân hoặc chỉ) để quy đổi."
      );
      return;
    }

    setSelectedExchangeIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // DATETIME CHANGERS
  const handleBuyDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowBuyDatePicker(false);
    if (selected) {
      const current = new Date(buyDate);
      current.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setBuyDate(current);
      // triggers timepicker after selecting date
      setTimeout(() => setShowBuyTimePicker(true), 150);
    }
  };

  const handleBuyTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowBuyTimePicker(false);
    if (selected) {
      const current = new Date(buyDate);
      current.setHours(selected.getHours(), selected.getMinutes());
      setBuyDate(current);
    }
  };

  const handleSellDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowSellDatePicker(false);
    if (selected) {
      const current = new Date(sellDate);
      current.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setSellDate(current);
      setTimeout(() => setShowSellTimePicker(true), 150);
    }
  };

  const handleSellTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowSellTimePicker(false);
    if (selected) {
      const current = new Date(sellDate);
      current.setHours(selected.getHours(), selected.getMinutes());
      setSellDate(current);
    }
  };

  const handleExchangeDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowExchangeDatePicker(false);
    if (selected) {
      const current = new Date(exchangeDate);
      current.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      setExchangeDate(current);
      setTimeout(() => setShowExchangeTimePicker(true), 150);
    }
  };

  const handleExchangeTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    setShowExchangeTimePicker(false);
    if (selected) {
      const current = new Date(exchangeDate);
      current.setHours(selected.getHours(), selected.getMinutes());
      setExchangeDate(current);
    }
  };

  // UNDO & DELETE HANDLERS
  const handleUndoSale = async (sale: GoldSaleRecord) => {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - sale.sellDate > THREE_DAYS_MS) {
      Alert.alert("Không thể hoàn tác", "Giao dịch bán vàng đã quá 3 ngày, không thể hoàn tác.");
      return;
    }

    Alert.alert(
      "Xác nhận hoàn tác",
      "Bạn có chắc chắn muốn hoàn tác giao dịch bán này? Các miếng vàng sẽ được khôi phục về trạng thái tích trữ.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Hoàn tác",
          style: "destructive",
          onPress: async () => {
            // Revert items status to "Tích trữ"
            const itemsToRevert = goldItems
              .filter((item) => sale.soldItemIds.includes(item.id))
              .map((item) => ({
                ...item,
                status: "Tích trữ" as const,
              }));

            const successItems = await storage.updateGoldItemsBulk(itemsToRevert);
            const successSale = await storage.deleteGoldSale(sale.id);

            if (successItems && successSale) {
              Alert.alert("Thành công", "Đã hoàn tác giao dịch bán vàng thành công! 🪙");
              loadData();
            } else {
              Alert.alert("Lỗi", "Đã xảy ra lỗi khi hoàn tác giao dịch bán vàng.");
            }
          },
        },
      ]
    );
  };

  const handleUndoItemSale = async (item: GoldItem) => {
    const sale = goldSales.find((s) => s.soldItemIds.includes(item.id));
    if (sale) {
      handleUndoSale(sale);
    } else {
      Alert.alert("Xác nhận hoàn tác", "Khôi phục miếng vàng này về trạng thái tích trữ?", [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: async () => {
            const updated = { ...item, status: "Tích trữ" as const };
            const success = await storage.updateGoldItemsBulk([updated]);
            if (success) {
              Alert.alert("Thành công", "Đã khôi phục miếng vàng thành công!");
              loadData();
            }
          },
        },
      ]);
    }
  };

  const handleDeletePurchasedItem = async (item: GoldItem) => {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - item.buyDate > THREE_DAYS_MS) {
      Alert.alert("Không thể xóa", "Miếng vàng đã mua quá 3 ngày, không thể xóa.");
      return;
    }

    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa vĩnh viễn miếng vàng này khỏi lịch sử?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            const success = await storage.deleteGoldItemsBulk([item.id]);
            if (success) {
              Alert.alert("Thành công", "Đã xóa miếng vàng thành công!");
              loadData();
            } else {
              Alert.alert("Lỗi", "Không thể xóa miếng vàng.");
            }
          },
        },
      ]
    );
  };

  const handleUndoExchange = async (item: GoldItem) => {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - item.buyDate > THREE_DAYS_MS) {
      Alert.alert("Không thể hoàn tác", "Miếng vàng quy đổi đã quá 3 ngày, không thể hoàn tác.");
      return;
    }

    Alert.alert(
      "Xác nhận hoàn tác đổi",
      "Hoàn tác quy đổi sẽ khôi phục lại các miếng vàng cũ về trạng thái Tích trữ và xóa miếng vàng mới này.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Hoàn tác",
          onPress: async () => {
            const fromIds = item.exchangedFromIds || [];
            const itemsToRevert = goldItems
              .filter((i) => fromIds.includes(i.id))
              .map((i) => ({
                ...i,
                status: "Tích trữ" as const,
              }));

            const successRevert = await storage.updateGoldItemsBulk(itemsToRevert);
            const successDelete = await storage.deleteGoldItemsBulk([item.id]);

            if (successRevert && successDelete) {
              Alert.alert("Thành công", "Đã hoàn tác quy đổi vàng thành công!");
              loadData();
            } else {
              Alert.alert("Lỗi", "Gặp lỗi khi hoàn tác quy đổi.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteExchangedItem = async (item: GoldItem) => {
    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - item.buyDate > THREE_DAYS_MS) {
      Alert.alert("Không thể xóa", "Miếng vàng quy đổi đã quá 3 ngày, không thể xóa.");
      return;
    }

    Alert.alert(
      "Xác nhận xóa quy đổi",
      "Xóa miếng vàng quy đổi này sẽ xóa vĩnh viễn miếng này VÀ tất cả các miếng vàng cũ đã dùng để đổi ra nó.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa vĩnh viễn",
          style: "destructive",
          onPress: async () => {
            const idsToDelete = [item.id, ...(item.exchangedFromIds || [])];
            const success = await storage.deleteGoldItemsBulk(idsToDelete);
            if (success) {
              Alert.alert("Thành công", "Đã xóa vĩnh viễn các miếng vàng liên quan!");
              loadData();
            } else {
              Alert.alert("Lỗi", "Gặp lỗi khi xóa.");
            }
          },
        },
      ]
    );
  };

  // RENDER FLATLIST ITEMS
  const renderGoldCardItem = ({ item }: { item: GoldItem }) => {
    const isTichTru = item.status === "Tích trữ";
    const isDaBan = item.status === "Đã bán";
    const isDaQuyDoi = item.status === "Đã quy đổi";

    // Dynamic styling for active gold items to make them look like real gold bars/blocks
    const getGoldBarStyles = () => {
      if (isDaBan) {
        return {
          cardBg: "#f8fafc",
          borderColor: "#fee2e2",
          borderWidth: 1,
          borderLeftWidth: 4,
          borderLeftColor: "#ef4444",
          textPrimary: "#64748b",
          textSecondary: "#94a3b8",
          textLabel: "#cbd5e1",
          watermarkColor: "rgba(0,0,0,0.01)",
          shadowColor: "transparent",
          brandLabel: "ĐÃ BÁN",
        };
      }
      if (isDaQuyDoi) {
        return {
          cardBg: "#f8fafc",
          borderColor: "#dbeafe",
          borderWidth: 1,
          borderLeftWidth: 4,
          borderLeftColor: "#3b82f6",
          textPrimary: "#64748b",
          textSecondary: "#94a3b8",
          textLabel: "#cbd5e1",
          watermarkColor: "rgba(0,0,0,0.01)",
          shadowColor: "transparent",
          brandLabel: "ĐÃ QUY ĐỔI",
        };
      }

      switch (item.rawUnit) {
        case "phân":
          return {
            cardBg: "#FFFDF2", // Vàng nhạt thanh nhã
            borderColor: "#FCD34D", // Viền vàng tươi
            borderWidth: 1.5,
            borderLeftWidth: 6,
            borderLeftColor: "#FCD34D",
            textPrimary: "#78350F", // Nâu đồng
            textSecondary: "#92400E", // Nâu vàng ấm
            textLabel: "#B45309", 
            watermarkColor: "rgba(252, 211, 77, 0.15)",
            shadowColor: "#FCD34D",
          };
        case "chỉ":
          return {
            cardBg: "#FFF8D6", // Vàng ấm trung cấp
            borderColor: "#E2B632", // Viền vàng kim loại
            borderWidth: 1.5,
            borderLeftWidth: 8,
            borderLeftColor: "#E2B632",
            textPrimary: "#5C3E00", // Nâu sẫm
            textSecondary: "#78350F",
            textLabel: "#92400E",
            watermarkColor: "rgba(226, 182, 50, 0.22)",
            shadowColor: "#E2B632",
          };
        case "cây":
          return {
            cardBg: "#FEE066", // Vàng đậm 24k đúc
            borderColor: "#C59B27", // Viền vàng đúc nguyên miếng
            borderWidth: 2,
            borderLeftWidth: 10,
            borderLeftColor: "#C59B27",
            textPrimary: "#3D1A00", // Nâu đậm đúc nhiệt
            textSecondary: "#5C3E00",
            textLabel: "#78350F",
            watermarkColor: "rgba(197, 155, 39, 0.35)",
            shadowColor: "#C59B27",
          };
        default:
          return {
            cardBg: "#ffffff",
            borderColor: "#e2e8f0",
            borderWidth: 1,
            borderLeftWidth: 4,
            borderLeftColor: "#fbbf24",
            textPrimary: "#1e293b",
            textSecondary: "#64748b",
            textLabel: "#94a3b8",
            watermarkColor: "rgba(0,0,0,0.02)",
            shadowColor: "transparent",
          };
      }
    };

    const goldStyle = getGoldBarStyles();

    const itemStyle = [
      styles.goldCard,
      {
        backgroundColor: goldStyle.cardBg,
        borderColor: goldStyle.borderColor,
        borderWidth: goldStyle.borderWidth,
        borderLeftWidth: goldStyle.borderLeftWidth,
        borderLeftColor: goldStyle.borderLeftColor,
        shadowColor: goldStyle.shadowColor,
      },
    ];

    const statusBadgeStyle = [
      styles.statusBadge,
      isTichTru && { backgroundColor: "rgba(255, 255, 255, 0.5)" },
      isDaBan && { backgroundColor: "#fee2e2" },
      isDaQuyDoi && { backgroundColor: "#dbeafe" },
    ];

    const statusTextStyle = [
      styles.statusText,
      isTichTru && { color: goldStyle.textPrimary },
      isDaBan && { color: "#ef4444" },
      isDaQuyDoi && { color: "#2563eb" },
    ];

    return (
      <View style={itemStyle}>
        {/* Watermark Logo (Engraved Stamp Look) */}
        <View style={{ position: "absolute", right: 12, bottom: 8, zIndex: 0 }}>
          <Coins size={75} color={goldStyle.watermarkColor} />
        </View>

        {/* Certificate / Brand Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, zIndex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: "900", letterSpacing: 1, color: goldStyle.textPrimary }}>
            HEO ĐẤT BÉO JEWELRY
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ fontSize: 9, fontWeight: "700", color: goldStyle.textSecondary, letterSpacing: 0.5 }}>
              {item.goldType}
            </Text>
            <View style={statusBadgeStyle}>
              <Text style={statusTextStyle}>{item.status}</Text>
            </View>
          </View>
        </View>

        {/* Stamped Gold Bar Body */}
        <View style={{
          borderWidth: isTichTru ? 1 : 0,
          borderColor: isTichTru ? "rgba(0,0,0,0.06)" : "transparent",
          borderRadius: 8,
          padding: 10,
          backgroundColor: isTichTru ? "rgba(255,255,255,0.25)" : "transparent",
          marginVertical: 6,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1,
        }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: "900", color: goldStyle.textPrimary, letterSpacing: 0.2 }}>
              {formatGoldQty(item.quantityInPhan)}
            </Text>
            {/* {isTichTru && (
              <Text style={{ fontSize: 9, color: goldStyle.textSecondary, letterSpacing: 0.2, marginTop: 2 }}>
                Lượng gốc: {item.rawQuantity} {item.rawUnit}
              </Text>
            )} */}
          </View>
          <Text style={{ fontSize: 9, fontWeight: "700", color: goldStyle.textSecondary, opacity: 0.8 }}>
            NO.{item.id.substring(item.id.length - 6).toUpperCase()}
          </Text>
        </View>

        {/* Purchase details */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 4, zIndex: 1 }}>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: goldStyle.textLabel, fontSize: 10, marginBottom: 1 }]}>Giá mua vào</Text>
            <Text style={{ color: goldStyle.textPrimary, fontSize: 13, fontWeight: "700" }}>
              {formatCurrency(item.buyPrice)} đ
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={[styles.detailLabel, { color: goldStyle.textLabel, fontSize: 10, marginBottom: 1 }]}>Phí gia công</Text>
            <Text style={{ color: goldStyle.textPrimary, fontSize: 13, fontWeight: "700" }}>
              {formatCurrency(item.craftFee)} đ
            </Text>
          </View>
        </View>

        {/* Footer info */}
        <View style={[styles.cardFooterRow, { borderTopColor: isTichTru ? "rgba(0,0,0,0.05)" : "#f1f5f9", marginTop: 8, zIndex: 1 }]}>
          <Text style={{ color: goldStyle.textSecondary, fontSize: 11 }}>
            {formatDateTime(new Date(item.buyDate))}
          </Text>
          {item.exchangeFee !== undefined && (
            <Text style={{ color: goldStyle.textSecondary, fontSize: 11 }}>
              Phí đổi: {formatCurrency(item.exchangeFee)} đ
            </Text>
          )}
        </View>

        {/* UNDO / DELETE ACTIONS ROW */}
        {Date.now() - item.buyDate <= 3 * 24 * 60 * 60 * 1000 && (
          <View style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            borderTopWidth: 1,
            borderTopColor: "#f1f5f9",
            paddingTop: 8,
            marginTop: 8,
            gap: 12
          }}>
            {isTichTru && !item.isExchanged && (
              <TouchableOpacity
                onPress={() => handleDeletePurchasedItem(item)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}
              >
                <Trash2 size={13} color="#cccccc" />
              </TouchableOpacity>
            )}
            {isTichTru && item.isExchanged && (
              <View style={{ flexDirection: "row", gap: 16 }}>
                <TouchableOpacity
                  onPress={() => handleUndoExchange(item)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}
                >
                  <RotateCcw size={13} color="#cccccc" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteExchangedItem(item)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}
                >
                  <Trash2 size={13} color="#cccccc" />
                </TouchableOpacity>
              </View>
            )}
            {isDaBan && (
              <TouchableOpacity
                onPress={() => handleUndoItemSale(item)}
                style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}
              >
                <RotateCcw size={13} color="#cccccc" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSaleCardItem = ({ item }: { item: GoldSaleRecord }) => {
    const isProfit = item.status === "Lời";
    const badgeStyle = [
      styles.profitBadge,
      isProfit ? styles.profitBadgeProfit : styles.profitBadgeLoss,
    ];
    const textStyle = [
      isProfit ? styles.profitTextProfit : styles.profitTextLoss,
    ];

    const cardStyle = [
      styles.saleCard,
      isProfit ? styles.saleCardProfit : styles.saleCardLoss,
    ];

    const getResolvedSoldItems = (): SoldItemSnapshot[] => {
      if (item.soldItems && item.soldItems.length > 0) {
        return item.soldItems;
      }
      // Fallback: lookup in local state goldItems (for old records)
      return goldItems
        .filter((g) => item.soldItemIds.includes(g.id))
        .map((g) => ({
          id: g.id,
          buyDate: g.buyDate,
          quantityInPhan: g.quantityInPhan,
          rawQuantity: g.rawQuantity,
          rawUnit: g.rawUnit,
          goldType: g.goldType,
          craftFee: g.craftFee,
          exchangeFee: g.exchangeFee,
        }));
    };

    const resolvedSoldItems = getResolvedSoldItems();

    return (
      <View style={cardStyle}>
        <View style={styles.saleTitleRow}>
          <Text style={styles.saleDate}>Ngày bán: {formatDateTime(new Date(item.sellDate))}</Text>
          <View style={badgeStyle}>
            <Text style={textStyle}>
              {item.status}: {isProfit ? "+" : ""}
              {formatCurrency(item.difference)} đ
            </Text>
          </View>
        </View>

        <View style={styles.saleDetailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Giá bán ra</Text>
            <Text style={[styles.detailValue, { color: "#1e293b", fontSize: 14 }]}>
              {formatCurrency(item.sellPrice)} đ
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Giá mua vào</Text>
            <Text style={[styles.detailValue, { color: "#64748b", fontSize: 14 }]}>
              {formatCurrency(item.buyPrice)} đ
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Chênh lệch</Text>
            <Text
              style={[
                styles.diffText,
                isProfit ? { color: "#10b981" } : { color: "#ef4444" },
              ]}
            >
              {isProfit ? "+" : ""}
              {formatCurrency(item.difference)} đ
            </Text>
          </View>
        </View>

        {/* List of Sold Items Details */}
        {resolvedSoldItems.length > 0 && (
          <View style={{
            borderTopWidth: 1,
            borderTopColor: "#f1f5f9",
            paddingTop: 10,
            marginTop: 10,
          }}>
            <Text style={{ fontSize: 11, fontWeight: "bold", color: "#64748b", marginBottom: 6 }}>
              VÀNG ĐÃ BÁN CHI TIẾT
            </Text>
            {resolvedSoldItems.map((sold, idx) => (
              <View key={sold.id || idx} style={{
                backgroundColor: "#f8fafc",
                borderRadius: 8,
                padding: 8,
                marginBottom: idx === resolvedSoldItems.length - 1 ? 0 : 8,
                borderLeftWidth: 3,
                borderLeftColor: "#fbbf24"
              }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: "#334155" }}>
                    Loại vàng: {sold.goldType || "Chưa xác định"}
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: "bold", color: "#475569" }}>
                    {formatGoldQty(sold.quantityInPhan)}
                  </Text>
                </View>
                
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 }}>
                  <Text style={{ fontSize: 10, color: "#64748b" }}>
                    Ngày mua: {formatDateTime(new Date(sold.buyDate))}
                  </Text>
                  <Text style={{ fontSize: 10, color: "#64748b" }}>
                    Phí GC: {formatCurrency(sold.craftFee)} đ {sold.exchangeFee !== undefined ? `| Phí đổi: ${formatCurrency(sold.exchangeFee)} đ` : ""}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* UNDO SALE ACTION */}
        {Date.now() - item.sellDate <= 3 * 24 * 60 * 60 * 1000 && (
          <View style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            borderTopWidth: 1,
            borderTopColor: "#f1f5f9",
            paddingTop: 8,
            marginTop: 8,
          }}>
            <TouchableOpacity
              onPress={() => handleUndoSale(item)}
              style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}
            >
              <RotateCcw size={13} color="#cccccc" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft color="#ffffff" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giao Dịch Vàng</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>TỔNG VÀNG ĐANG TÍCH TRỮ</Text>
          <Text style={styles.summaryValue}>
            {formatGoldQty(totalActiveQtyInPhan)}
          </Text>

          <View style={{ marginBottom: 14 }}>
            <Text style={styles.summaryTitle}>LỢI NHUẬN ĐÃ THU</Text>
            <Text style={{
              fontSize: 24,
              fontWeight: "bold",
              color: totalProfit >= 0 ? "#10b981" : "#ef4444",
              marginTop: 2,
            }}>
              {totalProfit >= 0 ? "+" : "-"}
              {formatCurrency(Math.abs(totalProfit))} đ
            </Text>
          </View>
          <View style={styles.summarySubRow}>
            <View>
              <Text style={styles.summarySubLabel}>Tổng Vốn Đầu Tư</Text>
              <Text style={styles.summarySubValue}>
                {formatCurrency(totalActivePrice)} đ
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.summarySubLabel}>Tổng số miếng</Text>
              <Text style={styles.summarySubValue}>{activeItems.length} miếng</Text>
            </View>
          </View>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === "active" && styles.tabItemActive]}
          onPress={() => setTab("active")}
        >
          <Coins color={tab === "active" ? "#d97706" : "#64748b"} size={16} />
          <Text
            style={[styles.tabText, tab === "active" && styles.tabTextActive]}
          >
            Tích trữ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, tab === "sales" && styles.tabItemActive]}
          onPress={() => setTab("sales")}
        >
          <TrendingUp
            color={tab === "sales" ? "#d97706" : "#64748b"}
            size={16}
          />
          <Text
            style={[styles.tabText, tab === "sales" && styles.tabTextActive]}
          >
            Lịch sử Bán
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, tab === "all" && styles.tabItemActive]}
          onPress={() => setTab("all")}
        >
          <History color={tab === "all" ? "#d97706" : "#64748b"} size={16} />
          <Text style={[styles.tabText, tab === "all" && styles.tabTextActive]}>
            Sổ tay
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST CONTENT */}
      {tab === "active" && (
        <FlatList
          data={activeItems}
          keyExtractor={(item) => item.id}
          renderItem={renderGoldCardItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Coins color="#cbd5e1" size={48} />
              <Text style={styles.emptyText}>
                Bạn chưa có miếng vàng tích trữ nào.{"\n"}Hãy nhấn "Mua vàng" để bắt đầu tích lũy!
              </Text>
            </View>
          }
        />
      )}

      {tab === "sales" && (
        <FlatList
          data={goldSales}
          keyExtractor={(item) => item.id}
          renderItem={renderSaleCardItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <TrendingUp color="#cbd5e1" size={48} />
              <Text style={styles.emptyText}>Chưa có lịch sử bán vàng.</Text>
            </View>
          }
        />
      )}

      {tab === "all" && (
        <FlatList
          data={goldItems}
          keyExtractor={(item) => item.id}
          renderItem={renderGoldCardItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <History color="#cbd5e1" size={48} />
              <Text style={styles.emptyText}>Chưa có giao dịch mua/đổi vàng nào.</Text>
            </View>
          }
        />
      )}

      {/* FLOATING ACTION BUTTONS */}
      {tab === "active" && (
        <View style={styles.fabRow}>
          <TouchableOpacity
            style={[styles.fabButton, styles.fabBuy]}
            onPress={() => {
              setBuyDate(new Date());
              setBuyVisible(true);
            }}
            activeOpacity={0.8}
          >
            <PlusCircle color="#ffffff" size={16} />
            <Text style={styles.fabText}>Mua vàng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fabButton, styles.fabSell]}
            onPress={() => {
              if (activeItems.length === 0) {
                Alert.alert("Thông báo", "Bạn không có vàng tích trữ để bán.");
                return;
              }
              setSellDate(new Date());
              setSellVisible(true);
            }}
            activeOpacity={0.8}
          >
            <TrendingDown color="#ffffff" size={16} />
            <Text style={styles.fabText}>Bán vàng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fabButton, styles.fabExchange]}
            onPress={() => {
              if (activeItems.length === 0) {
                Alert.alert("Thông báo", "Bạn không có vàng tích trữ để đổi.");
                return;
              }
              setExchangeDate(new Date());
              setExchangeVisible(true);
            }}
            activeOpacity={0.8}
          >
            <Scale color="#ffffff" size={16} />
            <Text style={styles.fabText}>Đổi vàng</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* MODAL: MUA VÀNG */}
      <Modal
        visible={buyVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBuyVisible(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lưu Lịch Sử Mua Vàng</Text>
              <TouchableOpacity
                onPress={() => setBuyVisible(false)}
                style={styles.modalCloseButton}
              >
                <X color="#64748b" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              {/* Unit Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Đơn vị vàng</Text>
                <View style={styles.unitSelector}>
                  {(["phân", "chỉ", "cây"] as const).map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.unitButton,
                        buyUnit === u && styles.unitButtonActive,
                      ]}
                      onPress={() => {
                        setBuyUnit(u);
                        if (u === "phân" || u === "chỉ") {
                          const parsed = parseFloat(buyQty.replace(",", "."));
                          if (!isNaN(parsed) && parsed > 9) {
                            setBuyQty("9");
                          }
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.unitButtonText,
                          buyUnit === u && styles.unitButtonTextActive,
                        ]}
                      >
                        {u.charAt(0).toUpperCase() + u.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Gold Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Loại vàng (*)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Ví dụ: Nhẫn tròn trơn, SJC 9999, PNJ..."
                    placeholderTextColor="#94a3b8"
                    value={buyGoldType}
                    onChangeText={setBuyGoldType}
                  />
                </View>
              </View>

              {/* Quantity */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số lượng đã mua (*)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder={`Ví dụ: ${buyUnit === "phân" ? "1" : "0.5"}`}
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={buyQty}
                    onChangeText={(text) => {
                      if (buyUnit === "phân" || buyUnit === "chỉ") {
                        const parsed = parseFloat(text.replace(",", "."));
                        if (!isNaN(parsed) && parsed > 9) {
                          return;
                        }
                      }
                      setBuyQty(text);
                    }}
                  />
                  <Text style={styles.inputSuffix}>{buyUnit}</Text>
                </View>
              </View>

              {/* Price */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Lượng tiền mua (*)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập số tiền..."
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={buyPrice}
                    onChangeText={(text) => setBuyPrice(formatMoneyInput(text))}
                  />
                  <Text style={styles.inputSuffix}>đ</Text>
                </View>
              </View>

              {/* Craft Fee */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phí gia công (Tùy chọn)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Mặc định: 0 đ"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={buyCraftFee}
                    onChangeText={(text) =>
                      setBuyCraftFee(formatMoneyInput(text))
                    }
                  />
                  <Text style={styles.inputSuffix}>đ</Text>
                </View>
              </View>

              {/* Buy Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ngày giờ mua vàng</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowBuyDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formatDateTime(buyDate)}
                  </Text>
                  <Calendar color="#64748b" size={18} />
                </TouchableOpacity>
              </View>

              {showBuyDatePicker && (
                <DateTimePicker
                  value={buyDate}
                  mode="date"
                  is24Hour={true}
                  onChange={handleBuyDateChange}
                />
              )}

              {showBuyTimePicker && (
                <DateTimePicker
                  value={buyDate}
                  mode="time"
                  is24Hour={true}
                  onChange={handleBuyTimeChange}
                />
              )}

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleBuySubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Xác nhận mua</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: BÁN VÀNG */}
      <Modal
        visible={sellVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSellVisible(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bán Vàng Tích Trữ</Text>
              <TouchableOpacity
                onPress={() => setSellVisible(false)}
                style={styles.modalCloseButton}
              >
                <X color="#64748b" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              {/* Select gold items */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Chọn miếng vàng muốn bán ({selectedSellItems.length} đã chọn)
                </Text>
                <ScrollView style={styles.selectionScroll} nestedScrollEnabled={true}>
                  {eligibleSellItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.selectableItem,
                        selectedSellIds[item.id] && styles.selectableItemSelected,
                      ]}
                      onPress={() => toggleSelectSell(item.id)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          selectedSellIds[item.id] && styles.checkboxSelected,
                        ]}
                      >
                        {selectedSellIds[item.id] && (
                          <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "bold" }}>
                            ✓
                          </Text>
                        )}
                      </View>
                      <View style={styles.selectableDetails}>
                        <Text style={styles.selectableQty}>
                          {formatGoldQty(item.quantityInPhan)} {item.goldType ? `(${item.goldType})` : ""}
                        </Text>
                        <Text style={styles.selectableSub}>
                          Mua vào: {formatCurrency(item.buyPrice)} đ | Phí GC: {formatCurrency(item.craftFee)} đ {item.exchangeFee !== undefined ? `| Phí đổi: ${formatCurrency(item.exchangeFee)} đ` : ""} | TT: {item.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Price sell */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Giá bán ra (*)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Nhập giá bán ra thực tế..."
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={sellPrice}
                    onChangeText={(text) =>
                      setSellPrice(formatMoneyInput(text))
                    }
                  />
                  <Text style={styles.inputSuffix}>đ</Text>
                </View>
              </View>

              {/* Sell Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ngày giờ bán vàng</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowSellDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formatDateTime(sellDate)}
                  </Text>
                  <Calendar color="#64748b" size={18} />
                </TouchableOpacity>
              </View>

              {showSellDatePicker && (
                <DateTimePicker
                  value={sellDate}
                  mode="date"
                  is24Hour={true}
                  onChange={handleSellDateChange}
                />
              )}

              {showSellTimePicker && (
                <DateTimePicker
                  value={sellDate}
                  mode="time"
                  is24Hour={true}
                  onChange={handleSellTimeChange}
                />
              )}

              {/* Calculation info box */}
              {selectedSellItems.length > 0 && (
                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tổng lượng bán</Text>
                    <Text style={styles.infoValue}>
                      {formatGoldQty(sellTotalQtyInPhan)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tổng vốn mua vào</Text>
                    <Text style={styles.infoValue}>
                      {formatCurrency(sellTotalBuyPrice)} đ
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Giá bán ra</Text>
                    <Text style={styles.infoValue}>
                      {formatCurrency(sellInputPrice)} đ
                    </Text>
                  </View>
                  <View style={styles.infoRowLast}>
                    <Text style={styles.infoLabel}>Chênh lệch (Lời / Lỗ)</Text>
                    <Text
                      style={[
                        styles.infoValueHighlight,
                        sellDifference >= 0
                          ? { color: "#10b981" }
                          : { color: "#ef4444" },
                      ]}
                    >
                      {sellDifference >= 0 ? "+" : ""}
                      {formatCurrency(sellDifference)} đ ({sellStatus})
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  selectedSellItems.length === 0 && styles.submitButtonDisabled,
                ]}
                disabled={selectedSellItems.length === 0}
                onPress={handleSellSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Xác nhận bán</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL: ĐỔI VÀNG */}
      <Modal
        visible={exchangeVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setExchangeVisible(false)}
      >
        <KeyboardAvoidingView
          behavior="padding"
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quy Đổi Vàng</Text>
              <TouchableOpacity
                onPress={() => setExchangeVisible(false)}
                style={styles.modalCloseButton}
              >
                <X color="#64748b" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
              {/* Select items */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Chọn các miếng vàng muốn đổi ({selectedExchangeItems.length} đã chọn)
                </Text>
                <Text style={{ fontSize: 11, color: "#64748b", marginBottom: 8, fontStyle: "italic" }}>
                  * Chọn từ 2 miếng trở lên cùng đơn vị (phân hoặc chỉ) và tổng số lượng phải chia hết cho 5.
                </Text>
                <ScrollView style={styles.selectionScroll} nestedScrollEnabled={true}>
                  {eligibleExchangeItems.map((item) => {
                    const isSelected = !!selectedExchangeIds[item.id];
                    const isDisabled = selectedExchangeUnit !== null && item.rawUnit !== selectedExchangeUnit && !isSelected;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        disabled={isDisabled}
                        style={[
                          styles.selectableItem,
                          isSelected && styles.selectableItemSelected,
                          isDisabled && { opacity: 0.4 },
                        ]}
                        onPress={() => toggleSelectExchange(item.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                            isDisabled && { borderColor: "#cbd5e1" },
                          ]}
                        >
                          {isSelected && (
                            <Text style={{ color: "#ffffff", fontSize: 10, fontWeight: "bold" }}>
                              ✓
                            </Text>
                          )}
                        </View>
                        <View style={styles.selectableDetails}>
                          <Text style={styles.selectableQty}>
                            {formatGoldQty(item.quantityInPhan)} {item.goldType ? `(${item.goldType})` : ""}
                          </Text>
                          <Text style={styles.selectableSub}>
                            Mua vào: {formatCurrency(item.buyPrice)} đ | Phí GC: {formatCurrency(item.craftFee)} đ {item.exchangeFee !== undefined ? `| Phí đổi: ${formatCurrency(item.exchangeFee)} đ` : ""} | TT: {item.status}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Compensation cash (Bù thêm tiền) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số tiền cần bù khi đổi (Tùy chọn)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Mặc định: 0 đ"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={exchangeComp}
                    onChangeText={(text) =>
                      setExchangeComp(formatMoneyInput(text))
                    }
                  />
                  <Text style={styles.inputSuffix}>đ</Text>
                </View>
              </View>

              {/* Craft fee for new piece */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phí gia công miếng mới (Tùy chọn)</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Mặc định: 0 đ"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={exchangeCraftFee}
                    onChangeText={(text) =>
                      setExchangeCraftFee(formatMoneyInput(text))
                    }
                  />
                  <Text style={styles.inputSuffix}>đ</Text>
                </View>
              </View>

              {/* Exchange Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ngày giờ quy đổi</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowExchangeDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    {formatDateTime(exchangeDate)}
                  </Text>
                  <Calendar color="#64748b" size={18} />
                </TouchableOpacity>
              </View>

              {showExchangeDatePicker && (
                <DateTimePicker
                  value={exchangeDate}
                  mode="date"
                  is24Hour={true}
                  onChange={handleExchangeDateChange}
                />
              )}

              {showExchangeTimePicker && (
                <DateTimePicker
                  value={exchangeDate}
                  mode="time"
                  is24Hour={true}
                  onChange={handleExchangeTimeChange}
                />
              )}

              {/* Summary Exchange info */}
              {selectedExchangeItems.length > 0 && (
                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tổng lượng đổi</Text>
                    <Text style={styles.infoValue}>
                      {formatGoldQty(exchangeTotalQtyInPhan)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Lượng vàng mới tạo</Text>
                    <Text style={[styles.infoValue, { color: "#fbbf24", fontWeight: "bold" }]}>
                      {`${displayExchangeTargetQty} ${displayExchangeTargetUnit}`}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tổng tiền đã mua cũ</Text>
                    <Text style={styles.infoValue}>
                      {formatCurrency(exchangeTotalBuyPrice)} đ
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tiền bù thêm (Phí đổi)</Text>
                    <Text style={styles.infoValue}>
                      {formatCurrency(parseMoney(exchangeComp))} đ
                    </Text>
                  </View>
                  <View style={styles.infoRowLast}>
                    <Text style={styles.infoLabel}>Tổng vốn miếng mới</Text>
                    <Text style={[styles.infoValueHighlight, { color: "#fbbf24" }]}>
                      {formatCurrency(exchangeTotalBuyPrice + parseMoney(exchangeCraftFee) + parseMoney(exchangeComp))} đ
                    </Text>
                  </View>
                  <View style={[styles.infoRow, { marginTop: 6, flexDirection: 'row', gap: 4, alignItems: 'center' }]}>
                    <Info size={12} color="#94a3b8" />
                    <Text style={{ fontSize: 10, color: "#94a3b8", flex: 1 }}>
                      Miếng vàng mới sẽ được tạo ở trạng thái Tích trữ, các miếng vàng cũ sẽ chuyển thành Đã quy đổi.
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  selectedExchangeItems.length === 0 && styles.submitButtonDisabled,
                ]}
                disabled={selectedExchangeItems.length === 0}
                onPress={handleExchangeSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitButtonText}>Xác nhận đổi</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default GoldHistoryScreen;
